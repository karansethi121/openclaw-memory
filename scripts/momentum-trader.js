// MOMENTUM BREAKOUT TRADER - Trade on upward momentum, not just oversold
// For strong uptrend markets (Bitcoin ~$68,700, strong bullish trend)

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

// MOMENTUM Trading Configuration
const CONFIG = {
    pairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'],
    tradeAmount: 5.00, // $5 minimum trade
    targetProfit: 0.003, // 0.3% target
    stopLoss: 0.002, // 0.2% stop loss
    minRSI: 45, // Don't wait for oversold, buy when momentum starts
    maxRSI: 70, // Avoid buying at extreme overbought
    checkInterval: 10000, // Check every 10 seconds
    maxPositionTime: 300000, // Close after 5 minutes if targets not hit
};

let balance = 22.55;
let totalProfit = 0;
let hasPosition = false;
let position = null;
let tradeCount = 0;

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

async function getTicker(symbol) {
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

// Calculate RSI (simplified, based on recent price changes)
async function calculateMomentum(symbol) {
    try {
        const ticker = await getTicker(symbol);
        const priceChange = parseFloat(ticker.priceChangePercent);

        // Volume check: Good momentum with strong volume
        const volumeQuote = parseFloat(ticker.quoteVolume);

        return {
            priceChangePercent: priceChange,
            volume: volumeQuote,
            hasMomentum: Math.abs(priceChangePercent) > 0.1 // 0.1% movement
        };
    } catch (err) {
        return null;
    }
}

async function buy(symbol, amount) {
    const price = await getCurrentPrice(symbol);
    const qty = (amount / price).toFixed(8);
    console.log(`BUYING ${amount.toFixed(2)} USDT of ${symbol} at $${price.toFixed(2)} (${qty} ${symbol.replace('USDT', '')})`);

    const result = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
        symbol: symbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: amount.toFixed(2)
    });

    return {
        symbol: symbol,
        side: 'BUY',
        qty: parseFloat(result.executedQty),
        price: parseFloat(result.cummulativeQuoteQty) / parseFloat(result.executedQty),
        amount: parseFloat(result.cummulativeQuoteQty),
        time: Date.now()
    };
}

async function sell(position) {
    const price = await getCurrentPrice(position.symbol);
    console.log(`SELLING ${position.qty.toFixed(6)} ${position.symbol.replace('USDT', '')} at $${price.toFixed(2)}`);

    try {
        const result = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
            symbol: position.symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: position.qty.toFixed(8)
        });

        const sellPrice = parseFloat(result.cummulativeQuoteQty) / parseFloat(result.executedQty);
        const profit = (sellPrice - position.price) * position.qty;
        const profitPercent = ((sellPrice - position.price) / position.price) * 100;

        tradeCount++;
        totalProfit += profit;
        console.log(`✅ SOLD: +$${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

        return { success: true, profit, profitPercent, price: sellPrice };
    } catch (err) {
        console.log(`❌ SELL FAILED: ${err.message}`);
        return { success: false, error: err.message };
    }
}

async function findBestTradingPair() {
    let bestPair = null;
    let bestScore = -100;

    for (const symbol of CONFIG.pairs) {
        const price = await getCurrentPrice(symbol);
        const momentum = await calculateMomentum(symbol);

        if (!momentum) continue;

        // Momentum Score: Positive price change + reasonable volume
        let score = 0;
        if (momentum.priceChangePercent > 0 && momentum.priceChangePercent < 2) {
            score = momentum.priceChangePercent; // Positive momentum, not extreme
        }

        // Avoid overbought (don't buy if price > 10% in 24h)
        if (momentum.priceChangePercent > 10) score -= 100;

        if (score > bestScore) {
            bestScore = score;
            bestPair = { symbol, price, momentum, score };
        }
    }

    return bestPair;
}

async function checkAndTrade() {
    try {
        if (hasPosition && position) {
            const currentPrice = await getCurrentPrice(position.symbol);
            const profitPercent = ((currentPrice - position.price) / position.price) * 100;
            const elapsed = Date.now() - position.time;

            // Check take profit
            if (profitPercent >= CONFIG.targetProfit * 100) {
                console.log(`\n🎯 TAKE PROFIT! +${profitPercent.toFixed(2)}%`);
                const result = await sell(position);
                if (result.success) hasPosition = false;
            }
            // Check stop loss
            else if (profitPercent <= -CONFIG.stopLoss * 100) {
                console.log(`\n🛑 STOP LOSS! ${profitPercent.toFixed(2)}%`);
                const result = await sell(position);
                if (result.success) hasPosition = false;
            }
            // Check max time
            else if (elapsed >= CONFIG.maxPositionTime) {
                console.log(`\n⏱️ MAX TIME REACHED (${elapsed/1000}s)`);
                const result = await sell(position);
                if (result.success) hasPosition = false;
            }
            else {
                console.log(`Holding: ${position.symbol} ${profitPercent.toFixed(2)}% (${(elapsed/1000).toFixed(0)}s)`);
            }
        } else {
            const bestPair = await findBestTradingPair();
            if (bestPair && bestPair.score > 0 && balance >= CONFIG.tradeAmount) {
                console.log(`\n🚀 MOMENTUM DETECTED: ${bestPair.symbol}`);
                console.log(`   Price Change: ${bestPair.momentum.priceChangePercent.toFixed(2)}%`);
                console.log(`   Momentum Score: ${bestPair.score.toFixed(2)}`);

                position = await buy(bestPair.symbol, CONFIG.tradeAmount);
                hasPosition = true;
            } else {
                console.log(`Scanning... (momentum scores too low or insufficient balance)`);
            }
        }

        // Print stats
        console.log(`💰 Stats | Trades: ${tradeCount} | Profit: $${totalProfit.toFixed(2)} | Balance: $${balance.toFixed(2)}`);

        setTimeout(checkAndTrade, CONFIG.checkInterval);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (err.message.includes('-2010')) {
            console.log('⚠️ Insufficient balance - waiting for deposit');
        }
        setTimeout(checkAndTrade, CONFIG.checkInterval);
    }
}

console.log('\n============================================================');
console.log('🚀 MOMENTUM BREAKOUT TRADER');
console.log('============================================================');
console.log('Strategy: Trade on upward momentum (not just oversold)');
console.log('Target: 0.3% profit | Stop: 0.2% loss | Max time: 5 min');
console.log('Pairs:', CONFIG.pairs.join(', '));
console.log('============================================================\n');

checkAndTrade();