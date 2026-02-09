// AGGRESSIVE Spot Scalping - Quick Buy-Sell Cycles

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

// AGGRESSIVE Configuration
const CONFIG = {
    symbol: 'BTCUSDT',
    tradePercent: 0.004, // 0.4% target profit
    lossPercent: 0.002, // 0.2% stop loss
    minBTCQty: 0.00008, // Min 0.00008 BTC (~$5.47) due to MIN_NOTIONAL filter
    checkInterval: 5000, // Check every 5 seconds (very fast)
    maxCycleTime: 180000, // Max 3 minutes per cycle
    tradeCount: 0,
    targetTrades: 20,
    targetProfit: 5.00 // $5 goal
};

let balance = 15.95;
let totalProfit = 0;
let hasPosition = false;
let position = null;
let tradeHistory = [];

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

async function getCurrentPrice() {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${CONFIG.symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(parseFloat(JSON.parse(data).price)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function placeOrder(side, quantity) {
    return await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
        symbol: CONFIG.symbol,
        side: side,
        type: 'MARKET',
        quantity: quantity.toFixed(6)
    });
}

async function executeBuyCycle() {
    console.log('\n' + '='.repeat(60));
    console.log('🟢 EXECUTING BUY');
    console.log('='.repeat(60));

    try {
        const currentPrice = await getCurrentPrice();
        const qty = CONFIG.minBTCQty; // Fixed minimum quantity to avoid filter errors
        const tradeAmount = qty * currentPrice;

        console.log(`   Price: $${currentPrice.toFixed(2)}`);
        console.log(`   Quantity: ${qty.toFixed(6)} BTC`);
        console.log(`   Value: $${tradeAmount.toFixed(2)}\n`);

        if (balance < tradeAmount) {
            console.log(`❌ Insufficient balance: $${balance.toFixed(2)} < $${tradeAmount.toFixed(2)}`);
            return false;
        }

        const order = await placeOrder('BUY', qty);

        const executedQty = parseFloat(order.executedQty);
        const avgPrice = parseFloat(order.cummulativeQuoteQty) / executedQty;
        const cost = parseFloat(order.cummulativeQuoteQty);

        position = {
            entryPrice: avgPrice,
            quantity: executedQty,
            cost: cost,
            entryTime: Date.now(),
            takeProfit: cost * (1 + CONFIG.tradePercent),
            stopLoss: cost * (1 - CONFIG.lossPercent)
        };

        balance -= cost;
        hasPosition = true;

        console.log('✅ POSITION OPENED');
        console.log(`   Entry: ${executedQty.toFixed(6)} @ $${avgPrice.toFixed(2)}`);
        console.log(`   Cost: $${cost.toFixed(2)}`);
        console.log(`   Take Profit: $${position.takeProfit.toFixed(2)}`);
        console.log(`   Stop Loss: $${position.stopLoss.toFixed(2)}\n`);

        return true;

    } catch (error) {
        console.error('❌ Buy failed:', error.message);
        return false;
    }
}

async function executeSellCycle() {
    console.log('\n' + '='.repeat(60));
    console.log('🔴 EXECUTING SELL');
    console.log('='.repeat(60));

    try {
        const currentPrice = await getCurrentPrice();
        const order = await placeOrder('SELL', position.quantity);

        const revenue = parseFloat(order.cummulativeQuoteQty);
        const profit = revenue - position.cost;
        const profitPercent = (profit / position.cost) * 100;

        balance += revenue;
        totalProfit += profit;
        CONFIG.tradeCount++;

        const trade = {
            id: CONFIG.tradeCount,
            entryPrice: position.entryPrice,
            exitPrice: currentPrice,
            cost: position.cost,
            revenue: revenue,
            profit: profit,
            profitPercent: profitPercent,
            duration: Date.now() - position.entryTime
        };
        tradeHistory.push(trade);

        console.log('✅ TRADE CLOSED');
        console.log(`   Entry: $${position.entryPrice.toFixed(2)}`);
        console.log(`   Exit: $${currentPrice.toFixed(2)}`);
        console.log(`   Revenue: $${revenue.toFixed(2)}`);
        console.log(`   Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(3)}%)`);
        console.log(`   Duration: ${(trade.duration / 1000).toFixed(1)}s\n`);

        hasPosition = false;
        position = null;

        return true;

    } catch (error) {
        console.error('❌ Sell failed:', error.message);
        return false;
    }
}

async function monitorAndTrade() {
    const currentPrice = await getCurrentPrice();

    if (hasPosition) {
        const currentValue = position.quantity * currentPrice;
        const profit = currentValue - position.cost;
        const profitPercent = (profit / position.cost) * 100;
        const timeHeld = Date.now() - position.entryTime;

        console.log(`⏳ HOLDING - Price: $${currentPrice.toFixed(2)} | P/L: ${profitPercent.toFixed(3)}% ($${profit.toFixed(2)}) | ${(timeHeld / 1000).toFixed(0)}s`);

        const hitTakeProfit = currentValue >= position.takeProfit;
        const hitStopLoss = currentValue <= position.stopLoss;
        const hitMaxTime = timeHeld >= CONFIG.maxCycleTime;

        if (hitTakeProfit || hitStopLoss || hitMaxTime) {
            const reason = hitTakeProfit ? 'TAKE PROFIT' : profit < 0 ? 'STOP LOSS' : 'TIME STOP';
            console.log(`🎯 ${reason} HIT!`);
            await executeSellCycle();
        }
    } else {
        // No position - try to buy
        console.log(`💰 Balance: $${balance.toFixed(2)} | Trades: ${CONFIG.tradeCount} | Total Profit: $${totalProfit.toFixed(2)} | Target: $${CONFIG.targetProfit.toFixed(2)}`);

        if (CONFIG.tradeCount < CONFIG.targetTrades && totalProfit < CONFIG.targetProfit) {
            await executeBuyCycle();
        }
    }
}

function showSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRADING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Trades: ${CONFIG.tradeCount}`);
    console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
    console.log(`Final Balance: $${balance.toFixed(2)}\n`);

    const wins = tradeHistory.filter(t => t.profit > 0).length;
    const avgWin = wins > 0 ? tradeHistory.filter(t => t.profit > 0).reduce((s, t) => s + t.profitPercent, 0) / wins : 0;
    const avgLoss = tradeHistory.filter(t => t.profit < 0).reduce((s, t) => s + t.profitPercent, 0) / (CONFIG.tradeCount - wins) || 0;

    console.log(`Win Rate: ${(wins / CONFIG.tradeCount * 100).toFixed(1)}%`);
    console.log(`Avg Win: ${avgWin.toFixed(3)}%`);
    console.log(`Avg Loss: ${avgLoss.toFixed(3)}%`);

    if (totalProfit >= CONFIG.targetProfit) {
        console.log('\n🎉 TARGET ACHIEVED!');
    } else {
        const remaining = CONFIG.targetProfit - totalProfit;
        console.log(`\nTarget Remaining: $${remaining.toFixed(2)}`);
    }
}

async function runAggressiveScalping() {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ AGGRESSIVE SPOT SCALPING BOT');
    console.log('='.repeat(60));
    console.log(`\nConfiguration:`);
    console.log(`  Symbol: ${CONFIG.symbol}`);
    console.log(`  Target Profit: ${(CONFIG.tradePercent * 100).toFixed(1)}%`);
    console.log(`  Stop Loss: ${(CONFIG.lossPercent * 100).toFixed(1)}%`);
    console.log(`  Position Size: ${(CONFIG.positionPercent * 100).toFixed(0)}%`);
    console.log(`  Max Cycle: ${CONFIG.maxCycleTime / 1000}s`);
    console.log(`  Check Interval: ${CONFIG.checkInterval / 1000}s`);
    console.log(`  Target Trades: ${CONFIG.targetTrades}`);
    console.log(`  Goal: $${CONFIG.targetProfit.toFixed(2)}\n`);

    while (CONFIG.tradeCount < CONFIG.targetTrades && totalProfit < CONFIG.targetProfit) {
        await monitorAndTrade();
        await new Promise(r => setTimeout(r, CONFIG.checkInterval));
    }

    // Close any open position
    if (hasPosition) {
        console.log('\n🔴 Closing final position...');
        await executeSellCycle();
    }

    showSummary();

    process.exit(0);
}

runAggressiveScalping().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});