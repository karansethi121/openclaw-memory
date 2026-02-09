// Futures Short-Selling Bot - Profit from Downtrends
// Strategy: SHORT when below EMA-50, profit from market drops

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

const BASE_URL = 'fapi.binance.com';

// Configuration
const CONFIG = {
    pairs: ['ETHUSDT', 'SOLUSDT', 'BTCUSDT'],
    leverage: 3, // Conservative 3x leverage
    takeProfitPercent: 0.005, // 0.5% profit per trade
    stopLossPercent: 0.008, // 0.8% stop loss
    maxCapital: 7.00, // Use all futures balance
    checkInterval: 300000, // Check every 5 minutes
    emaPeriod: 50
};

async function signedFuturesRequest(method, endpoint, params = {}) {
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

async function publicFuturesRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const queryString = new URLSearchParams(params).toString();
        
        https.get(`https://${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getFuturesBalance() {
    try {
        const balance = await signedFuturesRequest('GET', '/fapi/v2/balance');
        return balance.find(a => a.asset === 'USDT');
    } catch (error) {
        console.error('❌ Error getting balance:', error.message);
        return null;
    }
}

async function getFuturesAccount() {
    try {
        return await signedFuturesRequest('GET', '/fapi/v2/account');
    } catch (error) {
        console.error('❌ Error getting account:', error.message);
        return null;
    }
}

async function openPositions() {
    try {
        const account = await getFuturesAccount();
        return account.positions.filter(p => Math.abs(parseFloat(p.positionAmt)) > 0);
    } catch (error) {
        console.error('❌ Error getting positions:', error.message);
        return [];
    }
}

async function setLeverage(symbol, leverage) {
    try {
        console.log(`🔧 Setting ${leverage}x leverage for ${symbol}...`);
        const result = await signedFuturesRequest('POST', '/fapi/v1/leverage', {
            symbol: symbol,
            leverage: leverage
        });
        console.log(`✅ Leverage set to ${result.leverage}x`);
        return result;
    } catch (error) {
        console.error(`❌ Error setting leverage:`, error.message);
        return null;
    }
}

async function getKlines(symbol, interval, limit) {
    try {
        return await publicFuturesRequest('/fapi/v1/klines', {
            symbol: symbol,
            interval: interval,
            limit: limit.toString()
        });
    } catch (error) {
        console.error(`❌ Error getting klines:`, error.message);
        return [];
    }
}

async function calculateEMA(symbol) {
    const klines = await getKlines(symbol, '15m', CONFIG.emaPeriod);
    if (klines.length < CONFIG.emaPeriod) return null;

    const prices = klines.map(k => parseFloat(k[4])); // Close prices
    const multiplier = 2 / (CONFIG.emaPeriod + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
}

async function getCurrentPrice(symbol) {
    try {
        const result = await publicFuturesRequest('/fapi/v1/ticker/price', { symbol });
        return parseFloat(result.price);
    } catch (error) {
        console.error(`❌ Error getting price:`, error.message);
        return null;
    }
}

async function placeShortOrder(symbol, capital) {
    try {
        await setLeverage(symbol, CONFIG.leverage);
        
        const price = await getCurrentPrice(symbol);
        const leverage = CONFIG.leverage;
        const positionValue = capital * leverage;
        const quantity = positionValue / price;

        console.log(`\n⚡ SHORT ORDER: ${symbol}`);
        console.log(`   Capital: $${capital}`);
        console.log(`   Leverage: ${leverage}x`);
        console.log(`   Position: $${positionValue.toFixed(2)}`);
        console.log(`   Quantity: ${quantity.toFixed(4)}`);
        
        const order = await signedFuturesRequest('POST', '/fapi/v1/order', {
            symbol: symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: quantity.toFixed(3),
            positionSide: 'SHORT'
        });

        console.log(`✅ SHORT FILLED: Order ID ${order.orderId}`);
        console.log(`   Entry: $${parseFloat(order.avgPrice).toFixed(2)}`);
        console.log(`   Quantity: ${order.executedQty}\n`);

        return {
            symbol,
            orderId: order.orderId,
            entryPrice: parseFloat(order.avgPrice),
            quantity: parseFloat(order.executedQty),
            capital,
            leverage,
            positionValue,
            isOpen: true
        };
    } catch (error) {
        console.error(`❌ Error SHORTING:`, error.message);
        
        // Try with adjusted quantity on LOT_SIZE error
        if (error.message.includes('LOT_SIZE')) {
            const price = await getCurrentPrice(symbol);
            const quantity = Math.floor((capital * CONFIG.leverage) / price * 100) / 100;
            console.log(`🔧 Retrying with adjusted quantity: ${quantity}`);
            
            const order = await signedFuturesRequest('POST', '/fapi/v1/order', {
                symbol: symbol,
                side: 'SELL',
                type: 'MARKET',
                quantity: quantity.toFixed(2),
                positionSide: 'SHORT'
            });

            console.log(`✅ SHORT FILLED: Order ID ${order.orderId}`);
            return {
                symbol,
                orderId: order.orderId,
                entryPrice: parseFloat(order.avgPrice),
                quantity: quantity,
                capital,
                leverage: CONFIG.leverage,
                positionValue: quantity * parseFloat(order.avgPrice),
                isOpen: true
            };
        }
        
        return null;
    }
}

async function placeBuyOrder(symbol, quantity) {
    try {
        console.log(`💰 CLOSING SHORT: ${symbol}`);
        
        const order = await signedFuturesRequest('POST', '/fapi/v1/order', {
            symbol: symbol,
            side: 'BUY',
            type: 'MARKET',
            quantity: quantity.toFixed(3),
            positionSide: 'SHORT'
        });

        console.log(`✅ SHORT CLOSED: Order ID ${order.orderId}`);
        
        const entryPrice = parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty);
        const avgPrice = parseFloat(order.avgPrice);
        const quantityFilled = parseFloat(order.executedQty);
        const total = parseFloat(order.cummulativeQuoteQty);
        
        return {
            orderId: order.orderId,
            avgPrice,
            quantity: quantityFilled,
            total
        };
    } catch (error) {
        console.error(`❌ Error closing SHORT:`, error.message);
        return null;
    }
}

async function analyzeAndTrade(account, capital) {
    console.log('\n' + '='.repeat(80));
    console.log('⬇️ FUTURES SHORT-SELLING BOT - DOWNTREND PROFIT');
    console.log('='.repeat(80) + '\n');

    // Check existing positions
    const positions = await openPositions();
    if (positions.length > 0) {
        console.log(`\n📍 OPEN POSITIONS:\n`);
        for (const pos of positions) {
            const pnl = parseFloat(pos.unRealizedProfit);
            const icon = pnl >= 0 ? '🟢' : '🔴';
            const amt = parseFloat(pos.positionAmt);
            const entry = parseFloat(pos.entryPrice);
            const current = parseFloat(pos.markPrice);
            const change = ((current - entry) / entry) * 100;
            const profit = amt < 0 ? pnl : -pnl; // SHORT position: profit when price drops
            
            console.log(`   ${pos.symbol} ${pos.positionSide}: ${Math.abs(amt).toFixed(4)} @ $${entry.toFixed(2)}`);
            console.log(`   Current: $${current.toFixed(2)} (${change.toFixed(2)}%)`);
            console.log(`   ${icon} PnL: $${pnl.toFixed(2)}`);
            
            // Check for take-profit
            if (profit >= capital * CONFIG.takeProfitPercent) {
                console.log(`\n🎯 TAKE PROFIT DETECTED! Closing ${pos.symbol}...\n`);
                await placeBuyOrder(pos.symbol, Math.abs(amt));
            }
            // Check for stop-loss
            else if (profit <= -capital * CONFIG.stopLossPercent) {
                console.log(`\n🛑 STOP LOSS HIT! Closing ${pos.symbol}...\n`);
                await placeBuyOrder(pos.symbol, Math.abs(amt));
            }
        }
        console.log('\n');
        return;
    }

    // Check for SHORT opportunities
    console.log('🔍 SCANNING FOR DOWNTREND SHORT OPPORTUNITIES:\n');

    for (const pair of CONFIG.pairs) {
        try {
            const currentPrice = await getCurrentPrice(pair);
            const ema = await calculateEMA(pair);

            if (!ema) continue;

            const rsi = await calculateRSI(pair);

            console.log(`${pair}:`);
            console.log(`   Current: $${currentPrice.toFixed(2)}`);
            console.log(`   EMA-50: $${ema.toFixed(2)}`);
            console.log(`   RSI: ${rsi.toFixed(2)}`);

            // Buy Signal
            if (currentPrice < ema) {
                const indicator = (ema - currentPrice) / ema * 100;
                const signal = rsi > 50 ? 2 : 1;
                
                console.log(`   📉 BELOW EMA-${CONFIG.emaPeriod} (${indicator.toFixed(2)}% below)`);
                console.log(`   💡 Trend: DOWNTREND`);
                console.log(`   ⚡ Signal Strength: ${signal}/2`);

                if (signal === 2) {
                    console.log(`\n✅ GOOD SHORT OPPORTUNITY: ${pair}\n`);
                    return await placeShortOrder(pair, capital);
                } else {
                    console.log(`\n   ℹ️ Trend DOWN but signal weak - continue monitoring\n`);
                }
            } else {
                console.log(`   ✓ Above EMA (${((currentPrice - ema) / ema * 100).toFixed(2)}% above) - UPTREND\n`);
            }
        } catch (error) {
            console.error(`   ❌ ${pair}: ${error.message}\n`);
        }
    }

    console.log('='.repeat(80));
    console.log('✅ No short opportunities found. Continue monitoring...\n');
    console.log('='.repeat(80) + '\n');
}

async function calculateRSI(symbol) {
    try {
        const klines = await getKlines(symbol, '15m', 14);
        if (klines.length < 14) return 50;

        let gains = 0;
        let losses = 0;

        for (let i = 1; i < klines.length; i++) {
            const open = parseFloat(klines[i-1][4]);
            const close = parseFloat(klines[i][4]);
            const change = close - open;

            if (change > 0) gains += change;
            else losses -= change;
        }

        const avgGain = gains / 14;
        const avgLoss = losses / 14;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        return rsi;
    } catch (error) {
        return 50;
    }
}

async function shortCycle() {
    try {
        const balance = await getFuturesBalance();
        if (!balance || parseFloat(balance.availableBalance) < 5) {
            console.log('\n⏳ Insufficient futures balance (need $5+)\n');
            return;
        }

        const capital = parseFloat(balance.availableBalance);
        const account = await getFuturesAccount();

        console.log(`\n💼 Futures Balance: $${capital.toFixed(2)}`);
        console.log(`💰 Capital to use: $${capital.toFixed(2)}\n`);

        await analyzeAndTrade(account, capital);

    } catch (error) {
        console.error('❌ Error in cycle:', error.message);
    }
}

function runContinuous() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 FUTURES SHORT-SELLING BOT - AUTOMATIC MODE');
    console.log('='.repeat(80));
    console.log(`\nConfiguration:`);
    console.log(`  Pairs: ${CONFIG.pairs.join(', ')}`);
    console.log(`  Leverage: ${CONFIG.leverage}x`);
    console.log(`  Take Profit: ${(CONFIG.takeProfitPercent * 100).toFixed(1)}%`);
    console.log(`  Stop Loss: ${(CONFIG.stopLossPercent * 100).toFixed(1)}%`);
    console.log(`  Check Interval: ${CONFIG.checkInterval / 60000} minutes\n`);

    // Run immediately
    shortCycle();

    // Set up continuous monitoring
    setInterval(() => {
        shortCycle();
    }, CONFIG.checkInterval);
}

// Run based on argument
if (process.argv[2] === 'continuous') {
    runContinuous();
} else {
    shortCycle();
}

module.exports = { shortCycle, analyzeAndTrade, placeShortOrder, placeBuyOrder };