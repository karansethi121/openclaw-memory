const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

const CONFIG = {
    pairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'XRPUSDT'],
    tradeAmount: 5.00, // Updated: Consolidated to $34.70, using $5.00 per trade
    targetProfit: 0.002, // 0.2% - quick small profits
    stopLoss: 0.0015, // 0.15% - tight stops
    checkInterval: 3000, // Check every 3 seconds (scalping speed)
    maxPositionTime: 60000, // Close after 1 minute if targets not hit
    maxDailyTrades: 100,
};

let hasPosition = false;
let position = null;
let tradeCount = 0;
let totalProfit = 0;
let winCount = 0;
let lossCount = 0;

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

async function getKlines(symbol, interval = '1m') {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=20`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getPriceActionSignal(symbol) {
    try {
        const klines = await getKlines(symbol, '1m');
        if (klines.length < 20) return null;

        const closes = klines.map(k => parseFloat(k[4]));
        const volumes = klines.map(k => parseFloat(k[5]));

        const lastClose = closes[closes.length - 1];
        const prevClose = closes[closes.length - 2];
        const lastVolume = volumes[volumes.length - 1];
        const avgVolume = volumes.slice(-10).reduce((a, b) => a + b) / 10;

        const priceChange = (lastClose - prevClose) / prevClose;
        const volumeSpike = lastVolume > avgVolume * 1.5;

        if (priceChange > 0.001 && volumeSpike) {
            return { signal: 'BUY', reason: 'Uptrend + Volume spike', strength: priceChange * 100 };
        }

        const avg5 = closes.slice(-5).reduce((a, b) => a + b) / 5;
        const avg10 = closes.slice(-10).reduce((a, b) => a + b) / 10;
        const isDip = lastClose < avg5 && avg5 < avg10;

        if (isDip && priceChange > -0.001) {
            return { signal: 'BUY', reason: 'Dip recovery', strength: Math.abs(priceChange) * 100 };
        }

        return null;
    } catch (err) {
        return null;
    }
}

async function buy(symbol, amount) {
    console.log(`\n🚀 SCALPING: BUYING $${amount} of ${symbol}...`);
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
        amount: parseFloat(result.cummulativeQuoteQty),
        time: Date.now()
    };
}

async function sell(symbol) {
    console.log(`\n🔴 SCALPING: SELLING ${symbol}...`);

    const account = await signedRequest('api.binance.com', 'GET', '/account');
    const balance = account.balances.find(b => b.asset === symbol.replace('USDT', ''));
    const qty = parseFloat(balance.free);

    if (qty < 0.000001) {
        console.log('   ⚠️ No quantity to sell');
        hasPosition = false;
        return { success: false };
    }

    try {
        const result = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
            symbol: symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: qty.toFixed(8)
        });

        const sellPrice = parseFloat(result.cummulativeQuoteQty) / parseFloat(result.executedQty);
        const profit = sellPrice * parseFloat(result.executedQty) - position.amount;
        const profitPercent = ((sellPrice - position.price) / position.price) * 100;

        if (profit > 0) winCount++;
        else lossCount++;

        tradeCount++;
        totalProfit += profit;

        const emoji = profit > 0 ? '✅' : '❌';
        console.log(`${emoji} SOLD: ${profit > 0 ? '+' : ''}$${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

        return { success: true, profit, profitPercent };
    } catch (err) {
        console.log(`❌ SELL FAILED: ${err.message}`);
        hasPosition = false;
        return { success: false, error: err.message };
    }
}

async function checkAndTrade() {
    try {
        if (hasPosition && position) {
            const currentPrice = await getCurrentPrice(position.symbol);
            const profitPercent = ((currentPrice - position.price) / position.price) * 100;
            const elapsed = Date.now() - position.time;

            if (profitPercent >= CONFIG.targetProfit * 100) {
                console.log(`\n🎯 TAKE PROFIT! +${profitPercent.toFixed(2)}%`);
                await sell(position.symbol);
                hasPosition = false;
                position = null;
            } else if (profitPercent <= -CONFIG.stopLoss * 100) {
                console.log(`\n🛑 STOP LOSS! ${profitPercent.toFixed(2)}%`);
                await sell(position.symbol);
                hasPosition = false;
                position = null;
            } else if (elapsed >= CONFIG.maxPositionTime) {
                console.log(`\n⏱️ MAX TIME (${(elapsed/1000).toFixed(0)}s)`);
                await sell(position.symbol);
                hasPosition = false;
                position = null;
            } else {
                console.log(`   Holding: ${position.symbol} ${(profitPercent > 0 ? '+' : '')}${profitPercent.toFixed(2)}% (${(elapsed/1000).toFixed(0)}s)`);
            }
        } else {
            if (tradeCount >= CONFIG.maxDailyTrades) {
                console.log('📊 Daily trade limit reached');
                setTimeout(checkAndTrade, CONFIG.checkInterval);
                return;
            }

            console.log(`\n🔍 SCANNING for scalping opportunities...`);

            for (const symbol of CONFIG.pairs) {
                const signal = await getPriceActionSignal(symbol);
                if (signal && signal.signal === 'BUY') {
                    console.log(`   ✅ ${symbol}: ${signal.reason} (${signal.strength.toFixed(3)}%)`);
                    position = await buy(symbol, CONFIG.tradeAmount);
                    hasPosition = true;
                    break;
                }
            }

            if (!position) {
                console.log('   ⏳ No signals found');
            }
        }

        const winRate = tradeCount > 0 ? ((winCount / tradeCount) * 100).toFixed(1) : 0;
        console.log(`\n💰 Scalping | Trades: ${tradeCount} | W:${winCount} L:${lossCount} | WinRate: ${winRate}% | Profit: $${totalProfit.toFixed(2)}`);
        console.log('═'.repeat(60));

        setTimeout(checkAndTrade, CONFIG.checkInterval);
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        if (err.message.includes('-2010') || err.message.includes('insufficient')) {
            console.log('⚠️ Insufficient balance - waiting...');
        }
        hasPosition = false;
        position = null;
        setTimeout(checkAndTrade, CONFIG.checkInterval);
    }
}

console.log('\n============================================================');
console.log('⚡ HIGH-FREQUENCY SCALPER');
console.log('============================================================');
console.log('Strategy: Many small profits, fast trades');
console.log('Pairs:', CONFIG.pairs.join(', '));
console.log('Trade Amount: $5.00 (consolidated from $2.00)');
console.log('Target: +0.2% | Stop: -0.15% | Max time: 60s');
console.log('Speed: 3s checks');
console.log('≡'.repeat(60));

checkAndTrade();