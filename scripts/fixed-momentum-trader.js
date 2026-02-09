const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

const CONFIG = {
    pairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'],
    tradeAmount: 5.00, // Updated: Consolidated to $34.70, using $5.00 per trade
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

async function getAccount() {
    return await signedRequest('api.binance.com', 'GET', '/account');
}

async function sell(symbol) {
    console.log(`\n🔴 SELLING ALL of ${symbol}...`);

    const account = await getAccount();
    const balance = account.balances.find(b => b.asset === symbol.replace('USDT', ''));
    const qty = parseFloat(balance.free);

    console.log(`   Quantity: ${qty}`);

    if (qty < 0.000001) {
        console.log('   ⚠️ Quantity too small, skipping');
        hasPosition = false;
        return { success: false };
    }

    const price = await getCurrentPrice(symbol);
    const notional = qty * price;

    console.log(`   Price: $${price.toFixed(2)}`);
    console.log(`   Notional value: $${notional.toFixed(2)}`);

    if (notional < 5.00) {
        console.log(`   ❌ Notional too small ($${notional.toFixed(2)} < $5)`);
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

        tradeCount++;
        totalProfit += profit;
        console.log(`✅ SOLD: +$${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

        return { success: true, profit, profitPercent };
    } catch (err) {
        console.error(`❌ SELL FAILED: ${err.message}`);
        hasPosition = false;
        return { success: false, error: err.message };
    }
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
        amount: parseFloat(result.cummulativeQuoteQty),
        time: Date.now()
    };
}

async function getCurrentPositions() {
    try {
        const account = await getAccount();
        const positions = [];

        for (const asset of ['BTC', 'ETH', 'SOL', 'BNB', 'XRP']) {
            const bal = account.balances.find(b => b.asset === asset);
            if (bal && parseFloat(bal.free) > 0.00001) {
                const value = parseFloat(bal.free) * await getCurrentPrice(asset + 'USDT');
                if (value > 1) {
                    positions.push({
                        asset: asset,
                        symbol: asset + 'USDT',
                        qty: parseFloat(bal.free),
                        value: value
                    });
                }
            }
        }
        return positions;
    } catch (err) {
        return [];
    }
}

async function checkAndTrade() {
    try {
        const currentPositions = await getCurrentPositions();

        if (currentPositions.length > 0) {
            console.log(`\n📊 Found ${currentPositions.length} position(s):`);

            for (const pos of currentPositions) {
                const currentPrice = await getCurrentPrice(pos.symbol);
                const entryPrice = position && position.symbol === pos.symbol ? position.price : currentPrice;
                const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

                console.log(`   ${pos.symbol}: ${pos.qty.toFixed(6)} ($${pos.value.toFixed(2)}) | P/L: ${profitPercent > 0 ? '+' : ''}${profitPercent.toFixed(2)}%`);

                if (position && position.symbol === pos.symbol) {
                    const elapsed = Date.now() - position.time;

                    if (profitPercent >= CONFIG.targetProfit * 100) {
                        console.log(`\n🎯 TAKE PROFIT! +${profitPercent.toFixed(2)}%`);
                        await sell(pos.symbol);
                        hasPosition = false;
                        position = null;
                        break;
                    } else if (profitPercent <= -CONFIG.stopLoss * 100) {
                        console.log(`\n🛑 STOP LOSS! ${profitPercent.toFixed(2)}%`);
                        await sell(pos.symbol);
                        hasPosition = false;
                        position = null;
                        break;
                    } else if (elapsed >= CONFIG.maxPositionTime) {
                        console.log(`\n⏱️ MAX TIME (${(elapsed/60000).toFixed(0)} min)`);
                        await sell(pos.symbol);
                        hasPosition = false;
                        position = null;
                        break;
                    } else {
                        console.log(`   Holding (${(elapsed/1000).toFixed(0)}s)`);
                    }
                } else {
                    position = {
                        symbol: pos.symbol,
                        qty: pos.qty,
                        price: currentPrice,
                        amount: pos.value,
                        time: Date.now()
                    };
                    hasPosition = true;
                    console.log(`   Taking over existing position management`);
                    break;
                }
            }
        } else if (hasPosition && position) {
            console.log(`\n⚠️ Position tracking lost, checking ${position.symbol}...`);
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
                console.log(`\n⏱️ MAX TIME (${(elapsed/60000).toFixed(0)} min)`);
                await sell(position.symbol);
                hasPosition = false;
                position = null;
            } else {
                console.log(`   Holding: ${position.symbol} ${profitPercent.toFixed(2)}% (${(elapsed/1000).toFixed(0)}s)`);
            }
        } else {
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
        if (err.message.includes('-2010') || err.message.includes('insufficient')) {
            console.log('⚠️ Insufficient balance');
        }
        hasPosition = false;
        position = null;
        setTimeout(checkAndTrade, CONFIG.checkInterval);
    }
}

console.log('\n============================================================');
console.log('🚀 FIXED MOMENTUM TRADER');
console.log('============================================================');
console.log('Strategy: Buy pairs with positive 24h momentum');
console.log('Pairs:', CONFIG.pairs.join(', '));
console.log('Trade Amount: $5.00 (consolidated from $2.00)');
console.log('Target: +0.3% | Stop: -0.2% | Max time: 5 min');
console.log('FIXED: Properly handle existing positions and sell orders');
console.log('============================================================\n');

checkAndTrade();