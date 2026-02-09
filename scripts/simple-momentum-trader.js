const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

const CONFIG = {
    pairs: ['BTCUSDT', 'ETHUSDT'],
    tradeAmount: 5.00,
    targetProfit: 0.003,
    stopLoss: 0.002,
    checkInterval: 10000,
    maxPositionTime: 300000,
};

let hasPosition = false;
let position = null;
let tradeCount = 0;
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

async function buy(symbol, amount) {
    console.log(`\n🚀 BUYING $${amount} of ${symbol}...`);
    const price = await getCurrentPrice(symbol);
    console.log(`   Price: $${price.toFixed(2)}`);

    const result = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
        symbol: symbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: amount.toFixed(2)
    });

    return {
        symbol: symbol,
        qty: parseFloat(result.executedQty),
        price: parseFloat(result.cummulativeQuoteQty) / parseFloat(result.executedQty),
        time: Date.now()
    };
}

async function sell(position) {
    console.log(`\n🔴 SELLING ${position.qty.toFixed(6)} ${position.symbol.replace('USDT', '')}...`);
    const price = await getCurrentPrice(position.symbol);

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

    return { success: true, profit, profitPercent };
}

async function checkAndTrade() {
    try {
        if (hasPosition && position) {
            const currentPrice = await getCurrentPrice(position.symbol);
            const profitPercent = ((currentPrice - position.price) / position.price) * 100;
            const elapsed = Date.now() - position.time;

            if (profitPercent >= CONFIG.targetProfit * 100) {
                console.log(`\n🎯 TAKE PROFIT! +${profitPercent.toFixed(2)}%`);
                await sell(position);
                hasPosition = false;
            } else if (profitPercent <= -CONFIG.stopLoss * 100) {
                console.log(`\n🛑 STOP LOSS! ${profitPercent.toFixed(2)}%`);
                await sell(position);
                hasPosition = false;
            } else if (elapsed >= CONFIG.maxPositionTime) {
                console.log(`\n⏱️ MAX TIME (${(elapsed/60000).toFixed(0)} min)`);
                await sell(position);
                hasPosition = false;
            } else {
                console.log(`Holding: ${position.symbol} ${profitPercent.toFixed(2)}% (${(elapsed/1000).toFixed(0)}s)`);
            }
        } else {
            // Simple momentum check: buy first available pair with positive 24h change
            for (const symbol of CONFIG.pairs) {
                const ticker = await getTicker(symbol);
                const change = parseFloat(ticker.priceChangePercent);

                console.log(`\n${symbol}: 24h change ${(change > 0 ? '+' : '')}${change.toFixed(2)}%`);

                if (change > 0 && change < 5) {
                    console.log(`✅ Good momentum! Buying ${symbol}...`);
                    position = await buy(symbol, CONFIG.tradeAmount);
                    hasPosition = true;
                    break;
                }
            }
        }

        console.log(`\n💰 Trades: ${tradeCount} | Profit: $${totalProfit.toFixed(2)}`);
        console.log('─'.repeat(50));

        setTimeout(checkAndTrade, CONFIG.checkInterval);
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        if (err.message.includes('-2010')) {
            console.log('⚠️ Insufficient balance');
        }
        setTimeout(checkAndTrade, CONFIG.checkInterval);
    }
}

console.log('\n============================================================');
console.log('🚀 SIMPLE MOMENTUM TRADER');
console.log('============================================================');
console.log('Strategy: Buy first pair with positive 24h momentum');
console.log('Pairs:', CONFIG.pairs.join(', '));
console.log('Target: +0.3% | Stop: -0.2% | Max time: 5 min');
console.log('============================================================\n');

checkAndTrade();