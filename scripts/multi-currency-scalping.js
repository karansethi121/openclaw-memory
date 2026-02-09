// MULTI-CURRENCY SCALPING - 20 Crypto Pairs Simultaneously

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

// Top 20 cryptos by volume
const SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
    'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'MATICUSDT',
    'DOTUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'OPUSDT',
    'ARBUSDT', 'SHIBUSDT', 'PEPEUSDT', 'NEARUSDT', 'INJUSDT'
];

const CONFIG = {
    targetProfit: 0.004, // 0.4% take profit
    stopLoss: 0.002, // 0.2% stop loss
    checkInterval: 5000, // 5 seconds
    maxPositions: 3, // Max 3 positions across all pairs
    rsiPeriod: 10, // Shorter RSI for faster signals
    rsiOversold: 35, // Less strict - more opportunities
    rsiOverbought: 85 // Higher threshold
};

let positions = {}; // key: symbol
let balance = 15.95;
let totalProfit = 0;
let trades = [];

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
                        reject(new Error(`${parsed.code}: ${parsed.msg}`));
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

async function getKlines(symbol, interval = '5m', limit = 15) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const klines = JSON.parse(data);
                    resolve(klines.map(k => parseFloat(k[4]))); // Just close prices
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

function calculateRSI(prices, period) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    const rs = (gains / period) / (losses / period);
    if (losses === 0) return 100;
    return 100 - (100 / (1 + rs));
}

async function getSymbolInfo(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/exchangeInfo?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const symbolInfo = result.symbols[0];
                    const lotSize = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
                    const minNotional = symbolInfo.filters.find(f => f.filterType === 'MIN_NOTIONAL');
                    resolve({
                        stepSize: parseFloat(lotSize.stepSize),
                        minQty: parseFloat(lotSize.minQty),
                        minNotional: minNotional ? parseFloat(minNotional.minNotional) : 5 // Default to $5 if not found
                    });
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function placeOrder(symbol, side, quantity) {
    // Round to step size
    const info = await getSymbolInfo(symbol);
    const roundedQty = Math.floor(quantity / info.stepSize) * info.stepSize;
    
    return await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
        symbol: symbol,
        side: side,
        type: 'MARKET',
        quantity: roundedQty.toFixed(6)
    });
}

async function scanAllPairs() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 SCANNING 20 CRYPTO PAIRS');
    console.log('='.repeat(80) + '\n');

    const opportunities = [];

    for (const symbol of SYMBOLS) {
        try {
            const price = await getCurrentPrice(symbol);
            const prices = await getKlines(symbol, '5m', 15);
            const rsi = calculateRSI(prices, CONFIG.rsiPeriod);

            const isOversold = rsi < CONFIG.rsiOversold;
            const isOverbought = rsi > CONFIG.rsiOverbought;

            // Spot trading: Look for oversold OR undervalued conditions
            // Also look for momentum breakout (RSI rising from low)
            if (isOversold && !positions[symbol]) {
                opportunities.push({
                    symbol,
                    type: 'LONG',
                    price,
                    rsi,
                    strength: CONFIG.rsiOversold - rsi,
                    reason: 'Oversold'
                });
            }

            // Also add slightly undervalued pairs (RSI 35-65) if RSI is rising
            if (rsi >= 35 && rsi <= 65 && !positions[symbol]) {
                // Check momentum
                if (prices.length >= 3) {
                    const change = (prices[prices.length - 1] - prices[prices.length - 3]) / prices[prices.length - 3];
                    if (change > 0.002) { // 0.2% upward momentum
                        opportunities.push({
                            symbol,
                            type: 'LONG',
                            price,
                            rsi,
                            strength: change * 1000,
                            reason: 'Momentum'
                        });
                    }
                }
            }

            console.log(`  ${symbol.padEnd(12)} | Price: $${price <= 1 ? price.toFixed(6) : price.toFixed(2).padStart(9)} | RSI: ${rsi.toFixed(1).padStart(6)} | ${isOversold ? '🟢 BUY' : isOverbought ? '🔴 SELL' : '⏳ WAIT'}`);

        } catch (error) {
            console.log(`  ${symbol.padEnd(12)} | ❌ Error: ${error.message.substring(0, 30)}`);
        }
    }

    // Sort by strength (most oversold/overbought first)
    opportunities.sort((a, b) => b.strength - a.strength);

    return opportunities;
}

async function executeTrade(opp) {
    // Spot trading: Only BUY, no SHORT allowed
    const actualType = opp.type === 'SHORT' ? 'LONG' : opp.type; // Convert SHORT to LONG for spot

    console.log(`\n🚀 EXECUTING ${actualType}: ${opp.symbol} (${opp.type} signal)`);
    console.log(`   Price: $${opp.price <= 1 ? opp.price.toFixed(6) : opp.price.toFixed(2)}`);
    console.log(`   RSI: ${opp.rsi.toFixed(1)}\n`);

    try {
        const info = await getSymbolInfo(opp.symbol);
        const qty = Math.ceil((5.5 / opp.price) / info.stepSize) * info.stepSize; // Ensure round lot
        const order = await placeOrder(opp.symbol, 'BUY', qty);

        const executedQty = parseFloat(order.executedQty);
        const avgPrice = parseFloat(order.cummulativeQuoteQty) / executedQty;
        const cost = parseFloat(order.cummulativeQuoteQty);

        // Always LONG for spot trading
        positions[opp.symbol] = {
            type: 'LONG',
            entryPrice: avgPrice,
            quantity: executedQty,
            cost: cost,
            takeProfit: cost * 1.004,
            stopLoss: cost * 0.998,
            entryTime: Date.now()
        };

        console.log(`✅ POSITION OPENED`);
        console.log(`   Entry: ${executedQty.toFixed(6)} @ $${avgPrice.toFixed(2)}`);
        console.log(`   Cost: $${cost.toFixed(2)}`);
        console.log(`   TP: $${positions[opp.symbol].takeProfit.toFixed(2)} | SL: $${positions[opp.symbol].stopLoss.toFixed(2)}\n`);

        return true;

    } catch (error) {
        console.error(`❌ Order failed:`, error.message);
        return false;
    }
}

async function monitorPositions() {
    if (Object.keys(positions).length === 0) return;

    console.log('📊 POSITION MONITOR\n');

    for (const symbol in positions) {
        const pos = positions[symbol];
        const currentPrice = await getCurrentPrice(symbol);
        const currentValue = pos.quantity * currentPrice;
        const profit = pos.type === 'LONG' ? currentValue - pos.cost : pos.cost - currentValue;
        const profitPercent = (profit / pos.cost) * 100;

        console.log(`${symbol} (${pos.type}):`);
        console.log(`   Entry: $${pos.entryPrice.toFixed(2)} | Current: $${currentPrice.toFixed(2)}`);
        console.log(`   P/L: ${profitPercent.toFixed(3)}% ($${profit.toFixed(2)})`);

        const hitTP = pos.type === 'LONG' ? currentValue >= pos.takeProfit : currentValue <= pos.takeProfit;
        const hitSL = pos.type === 'LONG' ? currentValue <= pos.stopLoss : currentValue >= pos.stopLoss;

        if (hitTP || hitSL) {
            const reason = hitTP ? 'TAKE PROFIT' : 'STOP LOSS';
            console.log(`   🎯 ${reason} HIT!\n`);
            await closePosition(symbol, currentPrice, reason);
        } else {
            console.log(`   ⏳ Holding...\n`);
        }
    }
}

async function closePosition(symbol, price, reason) {
    const pos = positions[symbol];

    console.log(`🔴 CLOSING ${symbol} (${reason})`);

    try {
        const order = await placeOrder(symbol, 'SELL', pos.quantity);
        const revenue = parseFloat(order.cummulativeQuoteQty);
        const profit = revenue - pos.cost;
        const profitPercent = (profit / pos.cost) * 100;

        totalProfit += profit;
        balance += revenue;

        trades.push({
            symbol,
            type: pos.type,
            entryPrice: pos.entryPrice,
            exitPrice: price,
            cost: pos.cost,
            revenue,
            profit,
            profitPercent,
            reason,
            duration: Date.now() - pos.entryTime
        });

        console.log(`✅ CLOSED: Profit $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)\n`);
        console.log(`💰 Total: $${totalProfit.toFixed(2)} | Balance: $${balance.toFixed(2)}\n`);

        delete positions[symbol];

    } catch (error) {
        console.error(`❌ Close failed:`, error.message);
    }
}

async function runMultiCurrencyScalping() {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ MULTI-CURRENCY SCALPING - 20 PAIRS SIMULTANEOUSLY');
    console.log('='.repeat(80));
    console.log(`\nMonitoring ${SYMBOLS.length} pairs`);
    console.log(`Max Positions: ${CONFIG.maxPositions}`);
    console.log(`Target: +${(CONFIG.targetProfit * 100).toFixed(1)}% | Stop: -${(CONFIG.stopLoss * 100).toFixed(1)}%`);
    console.log(`Starting Balance: $${balance.toFixed(2)}\n`);

    while (trades.length < 50 && totalProfit < 5.00) {
        const opportunities = await scanAllPairs();

        if (opportunities.length > 0 && Object.keys(positions).length < CONFIG.maxPositions) {
            const numToOpen = Math.min(opportunities.length, CONFIG.maxPositions - Object.keys(positions).length);

            console.log(`\n✅ Found ${opportunities.length} opportunities, opening ${numToOpen}\n`);

            for (let i = 0; i < numToOpen; i++) {
                await executeTrade(opportunities[i]);
            }
        }

        await monitorPositions();

        console.log(`\n💰 Stats | Trades: ${trades.length} | Profit: $${totalProfit.toFixed(2)} | Positions: ${Object.keys(positions).length}\n`);
        console.log('='.repeat(80));

        await new Promise(r => setTimeout(r, CONFIG.checkInterval));
    }

    // Close all positions
    for (const symbol in positions) {
        const price = await getCurrentPrice(symbol);
        await closePosition(symbol, price, 'FINAL');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Trades: ${trades.length}`);
    console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
    console.log(`Balance: $${balance.toFixed(2)}\n`);

    const wins = trades.filter(t => t.profit > 0).length;
    const avgWin = wins > 0 ? trades.filter(t => t.profit > 0).reduce((s, t) => s + t.profitPercent, 0) / wins : 0;

    console.log(`Win Rate: ${(wins / trades.length * 100).toFixed(1)}%`);
    console.log(`Avg Win: ${avgWin.toFixed(2)}%`);

    process.exit(0);
}

runMultiCurrencyScalping().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});