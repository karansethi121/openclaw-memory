const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

// Configuration
const CONFIG = {
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'],
    takeProfitPercent: 0.025, // 2.5% profit target
    stopLossPercent: 0.005, // 0.5% stop loss
    volumeMultiplier: 2, // Volume must be 2x average
    positionSizePercent: 0.04, // 4% of capital per position
    checkInterval: 30000, // Check every 30 seconds
    maxPositions: 2, // Max 2 positions at once
    rsiThreshold: 50 // RSI above/below this for momentum
};

let positions = {};
let accountBalance = 15.95; // Starting balance
let trades = [];
let totalProfit = 0;

async function signedRequest(hostname, method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: hostname,
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

async function getTicker24hr(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getCurrentPrice(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(parseFloat(JSON.parse(data).price)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function placeOrder(symbol, side, quantity) {
    return await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
        symbol: symbol,
        side: side,
        type: 'MARKET',
        quantity: quantity.toFixed(6)
    });
}

// Simple momentum check (price trend over last minute)
async function checkMomentum(symbol, currentPrice) {
    // For real implementation, calculate actual momentum with historical data
    // This is a simplified version
    const ticker = await getTicker24hr(symbol);
    const priceChangePercent = parseFloat(ticker.priceChangePercent);
    return priceChangePercent;
}

function formatTime(uts) {
    return new Date(uts).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
}

async function scanForBreakouts() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 SCANNING FOR BREAKOUT OPPORTUNITIES');
    console.log('='.repeat(80) + '\n');

    const opportunities = [];

    for (const symbol of CONFIG.symbols) {
        try {
            const ticker = await getTicker24hr(symbol);
            const currentPrice = parseFloat(ticker.lastPrice);
            const high24h = parseFloat(ticker.highPrice);
            const low24h = parseFloat(ticker.lowPrice);
            const volume = parseFloat(ticker.volume);
            const priceChangePercent = parseFloat(ticker.priceChangePercent);

            const highBreakoutThreshold = high24h * 1.005; // +0.5% above high
            const lowBreakdownThreshold = low24h * 0.995; // -0.5% below low

            const isHighBreakout = currentPrice >= highBreakoutThreshold && priceChangePercent > 2;
            const isLowBreakdown = currentPrice <= lowBreakdownThreshold && priceChangePercent < -2;

            if (isHighBreakout && !positions[symbol]) {
                opportunities.push({
                    symbol,
                    type: 'LONG',
                    price: currentPrice,
                    reason: `Breakout above 24h high (${((currentPrice / high24h - 1) * 100).toFixed(2)}% above)`,
                    priceChangePercent,
                    volume
                });
            }

            if (isLowBreakdown && !positions[symbol]) {
                opportunities.push({
                    symbol,
                    type: 'SHORT',
                    price: currentPrice,
                    reason: `Breakdown below 24h low (${((1 - currentPrice / low24h) * 100).toFixed(2)}% below)`,
                    priceChangePercent,
                    volume
                });
            }

        } catch (error) {
            console.error(`❌ Error scanning ${symbol}:`, error.message);
        }
    }

    return opportunities;
}

async function executeBreakout(opportunity) {
    console.log(`\n🚀 EXECUTING ${opportunity.type}: ${opportunity.symbol}`);
    console.log(`   Current Price: $${opportunity.price.toFixed(2)}`);
    console.log(`   Reason: ${opportunity.reason}`);
    console.log(`   Price Change: ${opportunity.priceChangePercent.toFixed(2)}%\n`);

    try {
        const tradeSize = accountBalance * CONFIG.positionSizePercent;
        const qty = tradeSize / opportunity.price;

        const order = await placeOrder(opportunity.symbol, opportunity.type, qty);

        const executedQty = parseFloat(order.executedQty);
        const avgPrice = parseFloat(order.cummulativeQuoteQty) / executedQty;
        const cost = parseFloat(order.cummulativeQuoteQty);

        positions[opportunity.symbol] = {
            type: opportunity.type,
            entryPrice: avgPrice,
            quantity: executedQty,
            cost: cost,
            takeProfitPrice: opportunity.type === 'LONG' ?
                avgPrice * (1 + CONFIG.takeProfitPercent) :
                avgPrice * (1 - CONFIG.takeProfitPercent),
            stopLossPrice: opportunity.type === 'LONG' ?
                avgPrice * (1 - CONFIG.stopLossPercent) :
                avgPrice * (1 + CONFIG.stopLossPercent),
            orderId: order.orderId,
            entryTime: Date.now()
        };

        console.log(`✅ POSITION OPENED`);
        console.log(`   Entry: ${executedQty.toFixed(6)} @ $${avgPrice.toFixed(2)}`);
        console.log(`   Cost: $${cost.toFixed(2)}`);
        console.log(`   Take Profit: $${positions[opportunity.symbol].takeProfitPrice.toFixed(2)}`);
        console.log(`   Stop Loss: $${positions[opportunity.symbol].stopLossPrice.toFixed(2)}\n`);

        return true;

    } catch (error) {
        console.error(`❌ Order failed:`, error.message);
        return false;
    }
}

async function monitorPositions() {
    if (Object.keys(positions).length === 0) return;

    console.log('\n📊 MONITORING POSITIONS');

    for (const symbol in positions) {
        const position = positions[symbol];
        const currentPrice = await getCurrentPrice(symbol);

        const profitPercent = position.type === 'LONG' ?
            (currentPrice - position.entryPrice) / position.entryPrice :
            (position.entryPrice - currentPrice) / position.entryPrice;

        const profit = profitPercent * position.cost;

        console.log(`\n${symbol} (${position.type}):`);
        console.log(`   Entry: $${position.entryPrice.toFixed(2)}`);
        console.log(`   Current: $${currentPrice.toFixed(2)}`);
        console.log(`   P/L: ${profitPercent.toFixed(2)}% ($${profit.toFixed(2)})`);

        // Check exit conditions
        const hitTakeProfit = position.type === 'LONG' ?
            currentPrice >= position.takeProfitPrice :
            currentPrice <= position.takeProfitPrice;

        const hitStopLoss = position.type === 'LONG' ?
            currentPrice <= position.stopLossPrice :
            currentPrice >= position.stopLossPrice;

        if (hitTakeProfit) {
            console.log(`   🎯 TAKE PROFIT HIT!`);
            await closePosition(symbol, currentPrice, 'TAKE_PROFIT');
        } else if (hitStopLoss) {
            console.log(`   🛑 STOP LOSS HIT!`);
            await closePosition(symbol, currentPrice, 'STOP_LOSS');
        } else {
            console.log(`   ⏳ Holding... TP: $${position.takeProfitPrice.toFixed(2)}, SL: $${position.stopLossPrice.toFixed(2)}`);
        }
    }
}

async function closePosition(symbol, price, reason) {
    const position = positions[symbol];

    console.log(`\n🔴 CLOSING POSITION: ${symbol} (${reason})`);

    try {
        const order = await placeOrder(symbol, position.type === 'LONG' ? 'SELL' : 'BUY', position.quantity);

        const revenue = parseFloat(order.cummulativeQuoteQty);
        const profit = revenue - position.cost;
        const profitPercent = (profit / position.cost) * 100;

        totalProfit += profit;
        accountBalance += profit;

        trades.push({
            symbol,
            type: position.type,
            entryPrice: position.entryPrice,
            exitPrice: price,
            cost: position.cost,
            revenue: revenue,
            profit: profit,
            profitPercent: profitPercent,
            reason,
            duration: Date.now() - position.entryTime
        });

        console.log(`✅ TRADE CLOSED`);
        console.log(`   Cost: $${position.cost.toFixed(2)}`);
        console.log(`   Revenue: $${revenue.toFixed(2)}`);
        console.log(`   Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)\n`);

        delete positions[symbol];
        console.log(`💰 Total Profit: $${totalProfit.toFixed(2)}`);
        console.log(`💰 Account Balance: $${accountBalance.toFixed(2)}\n`);

        '='.repeat(80) + '\n';

    } catch (error) {
        console.error(`❌ Close failed:`, error.message);
    }
}

async function volatilityBreakoutCycle() {
    try {
        const opportunities = await scanForBreakouts();

        if (opportunities.length > 0) {
            console.log(`✅ Found ${opportunities.length} opportunity(ies):\n`);

            opportunities.forEach((opp, i) => {
                console.log(`${i + 1}. ${opp.symbol} ${opp.type}`);
                console.log(`   Price: $${opp.price.toFixed(2)}`);
                console.log(`   ${opp.reason}`);
                console.log(`   Change: ${opp.priceChangePercent.toFixed(2)}%\n`);
            });

            // Execute up to CONFIG.maxPositions
            const numPositions = Object.keys(positions).length;
            const canOpen = Math.min(CONFIG.maxPositions - numPositions, opportunities.length);

            for (let i = 0; i < canOpen; i++) {
                await executeBreakout(opportunities[i]);
            }
        } else {
            console.log('❌ No breakout opportunities found\n');
        }

        // Monitor existing positions
        await monitorPositions();

    } catch (error) {
        console.error('❌ Cycle error:', error.message);
    }
}

function runContinuous() {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ VOLATILITY BREAKOUT TRADING BOT');
    console.log('='.repeat(80));
    console.log(`\nConfiguration:`);
    console.log(`  Symbols: ${CONFIG.symbols.join(', ')}`);
    console.log(`  Take Profit: ${(CONFIG.takeProfitPercent * 100).toFixed(1)}%`);
    console.log(`  Stop Loss: ${(CONFIG.stopLossPercent * 100).toFixed(1)}%`);
    console.log(`  Max Positions: ${CONFIG.maxPositions}`);
    console.log(`  Position Size: ${(CONFIG.positionSizePercent * 100).toFixed(0)}%`);
    console.log(`  Check Interval: ${CONFIG.checkInterval / 1000}s`);
    console.log(`  Starting Balance: $${accountBalance.toFixed(2)}\n`);

    volatilityBreakoutCycle();

    setInterval(() => {
        volatilityBreakoutCycle();
    }, CONFIG.checkInterval);
}

if (process.argv[2] === 'continuous') {
    runContinuous();
} else {
    runContinuous();
}

module.exports = { CONFIG, volatilityBreakoutCycle, scanForBreakouts };