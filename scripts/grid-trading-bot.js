// Binance Grid Trading Bot - Profit from Sideways Markets
// Strategy: Buy low, sell high automatically within price range

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

const BASE_URL = 'api.binance.com';

// HTML Response Detection Function
function isHtmlResponse(data) {
  if (!data || typeof data !== 'string') return false;
  const trimmed = data.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

// Configuration
const CONFIG = {
    symbol: 'BTCUSDT', // BTC trading
    capital: 10.00, // Capital to allocate
    gridCount: 40, // Number of grid lines (2x MORE TRADING)
    rangePercent: 0.02, // 2% price range (smaller, faster triggers)
    profitPercent: 0.001, // 0.1% profit per grid (HALF for 2x more trades)
    minTradePercent: 0.01, // Minimum 1% of capital per trade
    checkInterval: 30000 // Check every 30 seconds (2x FASTER)
};

async function signedRequest(method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: BASE_URL,
            path: `${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Check for HTML response (API error)
                if (isHtmlResponse(data)) {
                    const operation = method || 'API Request';
                    console.log(`❌ ${operation}: API returned HTML instead of JSON`);
                    console.log('   → Likely: rate limiting, maintenance, or auth error');
                    console.log('   → Will retry next automation cycle');
                    reject(new Error('HTML response from API'));
                    return;
                }

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.code && parsed.code !== 200) {
                        reject(new Error(`Error ${parsed.code}: ${parsed.msg}`));
                    } else {
                        resolve(parsed);
                    }
                } catch (err) { reject(err); }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function publicRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const queryString = new URLSearchParams(params).toString();
        
        https.get(`https://${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Check for HTML response (API error)
                if (isHtmlResponse(data)) {
                    console.log(`❌ Public Request: API returned HTML instead of JSON`);
                    console.log('   → Likely: rate limiting, maintenance, or auth error');
                    console.log('   → Will retry next automation cycle');
                    reject(new Error('HTML response from API'));
                    return;
                }

                try {
                    resolve(JSON.parse(data));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getAccount() {
    try {
        return await signedRequest('GET', '/api/v3/account');
    } catch (error) {
        console.error('❌ Error getting account:', error.message);
        return null;
    }
}

async function getAssetBalance(asset) {
    try {
        const account = await getAccount();
        const bal = account.balances.find(b => b.asset === asset);
        return bal ? parseFloat(bal.free) : 0;
    } catch (error) {
        console.error(`❌ Error getting ${asset} balance:`, error.message);
        return 0;
    }
}

async function getCurrentPrice(symbol) {
    try {
        const result = await publicRequest('/api/v3/ticker/price', { symbol });
        return parseFloat(result.price);
    } catch (error) {
        console.error(`❌ Error getting price:`, error.message);
        return null;
    }
}

async function get24hStats(symbol) {
    try {
        return await publicRequest('/api/v3/ticker/24hr', { symbol });
    } catch (error) {
        console.error(`❌ Error getting 24h stats:`, error.message);
        return null;
    }
}

async function placeBuyOrder(symbol, amount) {
    try {
        const order = await signedRequest('POST', '/api/v3/order', {
            symbol: symbol,
            side: 'BUY',
            type: 'MARKET',
            quoteOrderQty: amount.toFixed(2)
        });

        console.log(`✅ BUY ORDER FILLED: Order ID ${order.orderId}`);
        console.log(`   Spent: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}`);
        console.log(`   Received: ${parseFloat(order.executedQty).toFixed(4)} ${symbol.replace('USDT', '')}\n`);

        return {
            orderId: order.orderId,
            price: parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty),
            quantity: parseFloat(order.executedQty),
            cost: parseFloat(order.cummulativeQuoteQty)
        };
    } catch (error) {
        console.error(`❌ Error buying:`, error.message);
        
        // Try alternative with LOT_SIZE adjustment
        if (error.message.includes('LOT_SIZE') || error.message.includes('MIN_NOTIONAL')) {
            const price = await getCurrentPrice(symbol);
            const qty = Math.floor(amount / 4 / price * 100) / 100;
            
            const order = await signedRequest('POST', '/api/v3/order', {
                symbol: symbol,
                side: 'BUY',
                type: 'MARKET',
                quantity: qty.toFixed(2)
            });

            console.log(`✅ BUY FILLED (adjusted): Order ID ${order.orderId}`);
            return {
                orderId: order.orderId,
                price: parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty),
                quantity: parseFloat(order.executedQty),
                cost: parseFloat(order.cummulativeQuoteQty)
            };
        }
        
        return null;
    }
}

async function placeSellOrder(symbol, quantity) {
    try {
        const order = await signedRequest('POST', '/api/v3/order', {
            symbol: symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: quantity.toFixed(4)
        });

        console.log(`✅ SELL ORDER FILLED: Order ID ${order.orderId}`);
        console.log(`   Sold: ${parseFloat(order.executedQty).toFixed(4)} ${symbol.replace('USDT', '')}`);
        console.log(`   Received: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}\n`);

        return {
            orderId: order.orderId,
            price: parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty),
            quantity: parseFloat(order.executedQty),
            revenue: parseFloat(order.cummulativeQuoteQty)
        };
    } catch (error) {
        console.error(`❌ Error selling:`, error.message);
        return null;
    }
}

class GridTradingBot {
    constructor(config) {
        this.config = config;
        this.gridLines = [];
        this.positions = {}; // Track positions at each grid level
        this.totalProfit = 0;
        this.tradeCount = 0;
    }

    async initialize() {
        console.log('\n' + '='.repeat(80));
        console.log('🔄 GRID TRADING BOT - INITIALIZING');
        console.log('='.repeat(80) + '\n');

        const currentPrice = await getCurrentPrice(this.config.symbol);
        const stats = await get24hStats(this.config.symbol);

        if (!currentPrice || !stats) {
            console.log('❌ Failed to get price data');
            return false;
        }

        // Calculate optimal grid range based on 24h volatility
        const volatility = (parseFloat(stats.highPrice) - parseFloat(stats.lowPrice)) / parseFloat(stats.lowPrice);
        const rangePercent = Math.max(volatility, this.config.rangePercent);

        const upperPrice = currentPrice * (1 + rangePercent / 2);
        const lowerPrice = currentPrice * (1 - rangePercent / 2);

        console.log(`\n📊 Grid Configuration:`);
        console.log(`   Symbol: ${this.config.symbol}`);
        console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
        console.log(`   24h Range: $${parseFloat(stats.lowPrice).toFixed(2)} - $${parseFloat(stats.highPrice).toFixed(2)}`);
        console.log(`   Volatility: ${(volatility * 100).toFixed(2)}%`);
        console.log(`   Grid Range: $${lowerPrice.toFixed(2)} - $${upperPrice.toFixed(2)}`);
        console.log(`   Grid Lines: ${this.config.gridCount}`);
        console.log(`   Grid Spacing: $${((upperPrice - lowerPrice) / this.config.gridCount).toFixed(2)}`);
        console.log(`   Profit per Grid: ${(this.config.profitPercent * 100).toFixed(1)}%\n`);

        // Create grid lines
        const gridSpacing = (upperPrice - lowerPrice) / this.config.gridCount;
        for (let i = 0; i <= this.config.gridCount; i++) {
            const price = lowerPrice + (i * gridSpacing);
            this.gridLines.push({
                index: i,
                price: price,
                buyPrice: price - (price * this.config.profitPercent),
                sellPrice: price + (price * this.config.profitPercent),
                active: true
            });
            this.positions[i] = null;
        }

        console.log(`✅ Grid initialized with ${this.gridLines.length} levels\n`);
        console.log('='.repeat(80) + '\n');

        return true;
    }

    async trade() {
        try {
            const currentPrice = await getCurrentPrice(this.config.symbol);
            if (!currentPrice) return;

            console.log(`\n⏰ ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
            console.log(`📊 Current: ${this.config.symbol} @ $${currentPrice.toFixed(2)}`);

            // Check balances
            const usdtBalance = await getAssetBalance('USDT');
            const assetSymbol = this.config.symbol.replace('USDT', '');
            const assetBalance = await getAssetBalance(assetSymbol);

            console.log(`💰 Balance: $${usdtBalance.toFixed(2)} USDT | ${assetBalance.toFixed(4)} ${assetSymbol}\n`);

            // Find current grid level
            let currentLevel = this.gridLines.findIndex(
                line => Math.abs(line.price - currentPrice) < line.price * 0.005
            );

            if (currentLevel === -1) {
                currentLevel = this.gridLines.findIndex(
                    (line, index) => {
                        const nextLine = this.gridLines[index + 1];
                        return currentPrice > line.price && (!nextLine || currentPrice < nextLine.price);
                    }
                );
            }

            if (currentLevel === -1 || currentLevel < 0 || currentLevel >= this.gridLines.length) {
                console.log(`⏳ Price outside grid range. Waiting...\n`);
                return;
            }

            const currentGrid = this.gridLines[currentLevel];
            console.log(`📍 Grid Level ${currentLevel}: $${currentGrid.price.toFixed(2)}`);

            // Buy logic: Price drops 0.1% below grid level (MORE SENSITIVE)
            if (!this.positions[currentLevel] && usdtBalance >= this.config.minTradePercent * this.config.capital) {
                const buyThreshold = currentGrid.price * (1 - this.config.profitPercent);
                // SUPER SENSITIVE: Buy on ANY drop toward grid level
                const nearBuyThreshold = currentGrid.price * (1 - this.config.profitPercent * 0.5);
                if (currentPrice <= buyThreshold || (currentLevel > 0 && currentGrid.price > currentPrice && (currentGrid.price - currentPrice) / currentGrid.price >= this.config.profitPercent * 0.2)) {
                    console.log(`🟢 BUY SIGNAL: Price at $${currentPrice.toFixed(2)} (threshold: $${buyThreshold.toFixed(2)})`);

                    // Calculate minimum Binance requirements
                    const minBTC = 0.00001; // Binance minimum for BTC (not SOL anymore!)
                    const priceNow = await getCurrentPrice(this.config.symbol);
                    const minUSD = minBTC * priceNow;
                    
                    const tradeSize = Math.max(
                        minUSD + 0.50, // Above minimum with buffer
                        Math.min(
                            usdtBalance * 0.4, // Use 40% of available balance
                            this.config.capital / (this.config.gridCount / 2) // Larger share
                        )
                    );

                    const maxTradeSize = usdtBalance * 0.8; // Max 80% of balance
                    const finalTradeSize = Math.min(tradeSize, maxTradeSize);

                    if (finalTradeSize > minUSD) { // Ensure above minimum
                        const buy = await placeBuyOrder(this.config.symbol, finalTradeSize);
                        if (buy) {
                            this.positions[currentLevel] = {
                                price: buy.price,
                                quantity: buy.quantity,
                                cost: buy.cost,
                                targetPrice: buy.price * (1 + this.config.profitPercent),
                                purchasedAt: Date.now()
                            };
                            console.log(`✅ Position opened at grid ${currentLevel}\n`);
                        }
                    }
                }
            }

            // Sell logic: Price rises 1% above entry price
            if (this.positions[currentLevel]) {
                const position = this.positions[currentLevel];
                const sellThreshold = position.targetPrice;

                if (currentPrice >= sellThreshold) {
                    console.log(`🔴 SELL SIGNAL: Price at $${currentPrice.toFixed(2)} (target: $${sellThreshold.toFixed(2)})`);

                    const sell = await placeSellOrder(this.config.symbol, position.quantity);
                    if (sell) {
                        const profit = sell.revenue - position.cost;
                        const profitPercent = (profit / position.cost) * 100;

                        this.totalProfit += profit;
                        this.tradeCount++;

                        console.log(`🎉 GRID TRADE COMPLETED:`);
                        console.log(`   Entry: $${position.price.toFixed(2)}`);
                        console.log(`   Exit: $${sell.price.toFixed(2)}`);
                        console.log(`   Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)\n`);

                        this.positions[currentLevel] = null;

                        console.log(`📊 Session Stats: ${this.tradeCount} trades, Total Profit: $${this.totalProfit.toFixed(2)}\n`);
                    }
                }
            }

            // Profit summary
            if (this.tradeCount > 0) {
                const avgProfit = this.totalProfit / this.tradeCount;
                const dailyProjected = avgProfit * this.tradeCount * 3; // Rough projection

                console.log(`💹 Performance Summary:`);
                console.log(`   Trades: ${this.tradeCount}`);
                console.log(`   Total Profit: $${this.totalProfit.toFixed(2)}`);
                console.log(`   Avg Profit/Trade: $${avgProfit.toFixed(2)}`);
                console.log(`   Projected Daily: ~$${dailyProjected.toFixed(2)}\n`);
            }

        } catch (error) {
            console.error('❌ Error in trading cycle:', error.message, '\n');
        }
    }

    async runContinuous() {
        const initialized = await this.initialize();
        if (!initialized) return;

        console.log(`\n🚀 Starting continuous grid trading...`);
        console.log(`   Check interval: ${this.config.checkInterval / 1000} seconds`);
        console.log(`   Trading ${this.config.symbol} on grid\n\n`);

        // Start trading loop
        while (true) {
            await this.trade();
            await new Promise(resolve => setTimeout(resolve, this.config.checkInterval));
        }
    }
}

// Create and run bot
if (process.argv[2] === 'continuous') {
    const bot = new GridTradingBot(CONFIG);
    bot.runContinuous();
} else {
    const bot = new GridTradingBot(CONFIG);
    bot.runContinuous();
}

module.exports = { GridTradingBot, CONFIG };