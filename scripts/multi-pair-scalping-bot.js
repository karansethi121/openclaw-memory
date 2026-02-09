const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

// Configuration
const CONFIG = {
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'],
    targetProfitPercent: 0.004, // 0.4% target profit
    stopLossPercent: 0.002, // 0.2% stop loss
    positionSizePercent: 0.03, // 3% of capital per position
    checkInterval: 15000, // Check every 15 seconds (high frequency)
    maxHoldTime: 30 * 60 * 1000, // Max 30 minutes
    maxPositions: 5, // Max 5 positions
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70
};

let positions = {};
let accountBalance = 15.95;
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

async function getKlines(symbol, interval = '15m', limit = 20) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const klines = JSON.parse(data);
                    // Convert to format: [open, high, low, close, volume]
                    resolve(klines.map(k => ({
                        close: parseFloat(k[4]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        volume: parseFloat(k[5])
                    })));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

// Calculate RSI using latest candles
function calculateRSI(klines, period = 14) {
    if (klines.length < period + 1) return 50; // Neutral if not enough data

    let gains = 0;
    let losses = 0;

    for (let i = klines.length - period; i < klines.length; i++) {
        const change = klines[i].close - klines[i - 1].close;
        if (change > 0) {
            gains += change;
        } else {
            losses -= change;
        }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
}

async function placeOrder(symbol, side, quantity) {
    return await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
        symbol: symbol,
        side: side,
        type: 'MARKET',
        quantity: quantity.toFixed(6)
    });
}

function formatTime(uts) {
    return new Date(uts).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
}

async function scanForScalps() {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ MULTI-PAIR SCALPING - SCANNING');
    console.log('='.repeat(80) + '\n');

    const opportunities = [];

    for (const symbol of CONFIG.symbols) {
        try {
            const currentPrice = await getCurrentPrice(symbol);
            const klines = await getKlines(symbol, '15m', 20);
            const rsi = calculateRSI(klines, CONFIG.rsiPeriod);
            const ticker = await getTicker24hr(symbol);

            const isOversold = rsi < CONFIG.rsiOversold;
            const isOverbought = rsi > CONFIG.rsiOverbought;

            const priceChangePercent = parseFloat(ticker.priceChangePercent);
            const volume = parseFloat(ticker.volume);
            const avgVolume = parseFloat(ticker.quoteVolume) / parseFloat(ticker.count);

            const isHighVolume = volume > avgVolume * 1.5;

            if (isOversold && isHighVolume && !positions[symbol]) {
                opportunities.push({
                    symbol,
                    type: 'LONG',
                    price: currentPrice,
                    rsi,
                    reason: `RSI oversold (${rsi.toFixed(1)} < ${CONFIG.rsiOversold}) + High volume`,
                    priceChangePercent
                });
            }

            if (isOverbought && isHighVolume && !positions[symbol]) {
                opportunities.push({
                    symbol,
                    type: 'SHORT',
                    price: currentPrice,
                    rsi,
                    reason: `RSI overbought (${rsi.toFixed(1)} > ${CONFIG.rsiOverbought}) + High volume`,
                    priceChangePercent
                });
            }

            console.log(`${symbol}:`);
            console.log(`   Price: $${currentPrice.toFixed(2)}`);
            console.log(`   RSI: ${rsi.toFixed(1)}`);
            console.log(`   Volume vs Avg: ${(volume / avgVolume).toFixed(2)}x`);
            console.log(`   Signal: ${isOversold ? '🟢 BUY' : isOverbought ? '🔴 SELL' : '⏳ Wait'}\n`);

        } catch (error) {
            console.error(`❌ Error scanning ${symbol}:`, error.message);
        }
    }

    return opportunities;
}

async function executeScalp(opportunity) {
    console.log(`\n🚀 EXECUTING ${opportunity.type}: ${opportunity.symbol}`);
    console.log(`   Current Price: $${opportunity.price.toFixed(2)}`);
    console.log(`   RSI: ${opportunity.rsi.toFixed(1)}`);
    console.log(`   Reason: ${opportunity.reason}\n`);

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
                avgPrice * (1 + CONFIG.targetProfitPercent) :
                avgPrice * (1 - CONFIG.targetProfitPercent),
            stopLossPrice: opportunity.type === 'LONG' ?
                avgPrice * (1 - CONFIG.stopLossPercent) :
                avgPrice * (1 + CONFIG.stopLossPercent),
            entryTime: Date.now(),
            orderId: order.orderId
        };

        console.log(`✅ POSITION OPENED`);
        console.log(`   Entry: ${executedQty.toFixed(6)} @ $${avgPrice.toFixed(2)}`);
        console.log(`   Cost: $${cost.toFixed(2)}`);
        console.log(`   Take Profit: $${positions[opportunity.symbol].takeProfitPrice.toFixed(2)} (${CONFIG.targetProfitPercent * 100}%)`);
        console.log(`   Stop Loss: $${positions[opportunity.symbol].stopLossPrice.toFixed(2)} (${CONFIG.stopLossPercent * 100}%)\n`);

        return true;

    } catch (error) {
        console.error(`❌ Order failed:`, error.message);
        return false;
    }
}

async function monitorPositions() {
    if (Object.keys(positions).length === 0) return;

    console.log('📊 MONITORING POSITIONS');

    for (const symbol in positions) {
        const position = positions[symbol];
        const currentPrice = await getCurrentPrice(symbol);
        const currentPricePercent = position.type === 'LONG' ?
            (currentPrice - position.entryPrice) / position.entryPrice :
            (position.entryPrice - currentPrice) / position.entryPrice;

        const timeHeld = Date.now() - position.entryTime;
        const timeLeft = CONFIG.maxHoldTime - timeHeld;

        const profit = currentPricePercent * position.cost;
        const profitPercent = currentPricePercent * 100;

        console.log(`\n${symbol} (${position.type}):`);
        console.log(`   Entry: $${position.entryPrice.toFixed(2)}`);
        console.log(`   Current: $${currentPrice.toFixed(2)}`);
        console.log(`   P/L: ${profitPercent.toFixed(3)}% ($${profit.toFixed(2)})`);
        console.log(`   Time: ${Math.floor(timeHeld / 1000 / 60)}m (max ${CONFIG.maxHoldTime / 60000}m)`);

        // Check exit conditions
        const hitTakeProfit = position.type === 'LONG' ?
            currentPrice >= position.takeProfitPrice :
            currentPrice <= position.takeProfitPrice;

        const hitStopLoss = position.type === 'LONG' ?
            currentPrice <= position.stopLossPrice :
            currentPrice >= position.stopLossPrice;

        const hitMaxTime = timeHeld >= CONFIG.maxHoldTime;

        if (hitTakeProfit) {
            console.log(`   🎯 TAKE PROFIT HIT!`);
            await closePosition(symbol, currentPrice, 'TAKE_PROFIT');
        } else if (hitStopLoss) {
            console.log(`   🛑 STOP LOSS HIT!`);
            await closePosition(symbol, currentPrice, 'STOP_LOSS');
        } else if (hitMaxTime) {
            console.log(`   ⏱️  MAX TIME REACHED - Closing`);
            await closePosition(symbol, currentPrice, 'TIME_STOP');
        } else {
            console.log(`   ⏳ Holding...`);
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
        console.log(`   Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

        console.log(`\n💰 TOTALS:`);
        console.log(`   Total Profit: $${totalProfit.toFixed(2)}`);
        console.log(`   Account Balance: $${accountBalance.toFixed(2)}`);
        console.log(`   Trades: ${trades.length}\n`);

        delete positions[symbol];
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Close failed:', error.message);
    }
}

async function scalpingCycle() {
    try {
        const opportunities = await scanForScalps();

        if (opportunities.length > 0 && Object.keys(positions).length < CONFIG.maxPositions) {
            console.log(`✅ Found ${opportunities.length} opportunity(ies), max ${CONFIG.maxPositions} positions\n`);

            let opened = 0;
            const maxOpen = CONFIG.maxPositions - Object.keys(positions).length;

            for (let i = 0; i < Math.min(opportunities.length, maxOpen); i++) {
                const success = await executeScalp(opportunities[i]);
                if (success) opened++;
            }

            if (opened > 0) {
                console.log(`✅ Opened ${opened} new position(s)\n`);
            }
        }

        // Monitor existing positions
        await monitorPositions();

    } catch (error) {
        console.error('❌ Cycle error:', error.message);
    }
}

function runContinuous() {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ MULTI-PAIR HIGH-FREQUENCY SCALPING BOT');
    console.log('='.repeat(80));
    console.log(`\nConfiguration:`);
    console.log(`  Symbols: ${CONFIG.symbols.join(', ')}`);
    console.log(`  Target Profit: ${(CONFIG.targetProfitPercent * 100).toFixed(1)}%`);
    console.log(`  Stop Loss: ${(CONFIG.stopLossPercent * 100).toFixed(1)}%`);
    console.log(`  Max Hold: ${CONFIG.maxHoldTime / 60000} minutes`);
    console.log(`  Max Positions: ${CONFIG.maxPositions}`);
    console.log(`  Position Size: ${(CONFIG.positionSizePercent * 100).toFixed(0)}%`);
    console.log(`  Check Interval: ${CONFIG.checkInterval / 1000}s`);
    console.log(`  Starting Balance: $${accountBalance.toFixed(2)}`);
    console.log(`  RSI Period: ${CONFIG.rsiPeriod}`);
    console.log(`  RSI Oversold: ${CONFIG.rsiOversold} (BUY)`);
    console.log(`  RSI Overbought: ${CONFIG.rsiOverbought} (SELL)\n`);

    scalpingCycle();

    setInterval(() => {
        scalpingCycle();
    }, CONFIG.checkInterval);
}

if (process.argv[2] === 'continuous') {
    runContinuous();
} else {
    runContinuous();
}

module.exports = { CONFIG, scalpingCycle, scanForScalps };