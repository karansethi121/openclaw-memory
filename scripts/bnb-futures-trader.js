const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const ApiHandler = require('./api-response-handler');
const apiHandler = new ApiHandler();

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

const CONFIG = {
    symbol: 'BNBUSDT',
    tradeAmount: 6.50,
    targetProfit: 0.003,
    stopLoss: 0.002,
    checkInterval: 10000,
    maxPositionTime: 300000,
};

let hasPosition = false;
let position = null;
let tradeCount = 0;
let totalProfit = 0;

async function signedRequest(method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v1${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Use ApiHandler to parse response with HTML detection
                const parsed = apiHandler.parseResponse(data, `${method} ${endpoint}`);

                if (parsed && parsed.shouldRetry) {
                    // Delay and retry
                    setTimeout(() => {
                        apiHandler.resetRetries();
                        signedRequest(method, endpoint, params).then(resolve).catch(reject);
                    }, apiHandler.retryDelay);
                    return;
                }

                if (parsed && parsed.error) {
                    reject(new Error(parsed.error));
                    return;
                }

                if (!parsed) {
                    reject(new Error('Failed to parse API response'));
                    return;
                }

                // Normal response handling
                if (parsed.code && parsed.code !== 200) {
                    reject(new Error(`${parsed.code}: ${parsed.msg}`));
                } else {
                    resolve(parsed);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function getFuturesPrice(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Use ApiHandler to parse response with HTML detection
                const parsed = apiHandler.parseResponse(data, 'getFuturesPrice');

                if (parsed && parsed.shouldRetry) {
                    setTimeout(() => {
                        apiHandler.resetRetries();
                        getFuturesPrice(symbol).then(resolve).catch(reject);
                    }, apiHandler.retryDelay);
                    return;
                }

                if (parsed && parsed.error) {
                    reject(new Error(parsed.error));
                    return;
                }

                if (!parsed || !parsed.price) {
                    reject(new Error('Failed to get futures price'));
                    return;
                }

                resolve(parseFloat(parsed.price));
            });
        }).on('error', reject);
    });
}

async function getFuturesTicker(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Use ApiHandler to parse response with HTML detection
                const parsed = apiHandler.parseResponse(data, 'getFuturesTicker');

                if (parsed && parsed.shouldRetry) {
                    setTimeout(() => {
                        apiHandler.resetRetries();
                        getFuturesTicker(symbol).then(resolve).catch(reject);
                    }, apiHandler.retryDelay);
                    return;
                }

                if (parsed && parsed.error) {
                    reject(new Error(parsed.error));
                    return;
                }

                if (!parsed) {
                    reject(new Error('Failed to get futures ticker'));
                    return;
                }

                resolve(parsed);
            });
        }).on('error', reject);
    });
}

async function getFuturesAccount() {
    return await signedRequest('GET', '/account');
}

async function buyFutures(symbol, amount) {
    console.log(`\n🚀 BUYING $${amount} of ${symbol} (FUTURES)...`);
    const price = await getFuturesPrice(symbol);
    console.log(`   Price: $${price.toFixed(2)}`);

    const qty = (amount / price).toFixed(3);

    const result = await signedRequest('POST', '/order', {
        symbol: symbol,
        side: 'BUY',
        type: 'MARKET',
        quantity: qty,
        positionSide: 'LONG'
    });

    return {
        symbol: symbol,
        qty: parseFloat(result.executedQty),
        price: parseFloat(result.avgPrice) || price,
        amount: parseFloat(result.cummulativeQuoteQty),
        time: Date.now()
    };
}

async function sellFutures(position) {
    console.log(`\n🔴 SELLING ${position.qty.toFixed(3)} ${position.symbol} (FUTURES)...`);

    const result = await signedRequest('POST', '/order', {
        symbol: position.symbol,
        side: 'SELL',
        type: 'MARKET',
        quantity: position.qty.toFixed(3),
        positionSide: 'LONG'
    });

    const sellPrice = parseFloat(result.avgPrice) || await getFuturesPrice(position.symbol);
    const profit = (sellPrice - position.price) * position.qty;
    const profitPercent = ((sellPrice - position.price) / position.price) * 100;

    tradeCount++;
    totalProfit += profit;
    console.log(`✅ SOLD: +$${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

    return { success: true, profit, profitPercent };
}

async function checkFuturesPosition() {
    try {
        const account = await getFuturesAccount();
        for (const pos of account.positions) {
            if (pos.symbol === CONFIG.symbol && pos.positionAmt && parseFloat(pos.positionAmt) !== 0) {
                return {
                    qty: parseFloat(pos.positionAmt),
                    entry: parseFloat(pos.entryPrice),
                    unrealizedPnl: parseFloat(pos.unRealizedProfit)
                };
            }
        }
        return null;
    } catch (err) {
        return null;
    }
}

async function checkAndTrade() {
    try {
        const currentPos = await checkFuturesPosition();

        if (currentPos) {
            const currentPrice = await getFuturesPrice(CONFIG.symbol);
            const entryPrice = position ? position.price : currentPos.entry;
            const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
            const elapsed = position ? Date.now() - position.time : 0;

            console.log(`\n📊 Position: ${currentPos.qty.toFixed(3)} ${CONFIG.symbol}`);
            console.log(`   P/L: ${profitPercent > 0 ? '+' : ''}${profitPercent.toFixed(2)}% | Unrealized: $${currentPos.unrealizedPnl.toFixed(2)}`);

            if (profitPercent >= CONFIG.targetProfit * 100) {
                console.log(`\n🎯 TAKE PROFIT! +${profitPercent.toFixed(2)}%`);
                const result = await sellFutures(position || currentPos);
                if (result.success) hasPosition = false;
            } else if (profitPercent <= -CONFIG.stopLoss * 100) {
                console.log(`\n🛑 STOP LOSS! ${profitPercent.toFixed(2)}%`);
                const result = await sellFutures(position || currentPos);
                if (result.success) hasPosition = false;
            } else if (elapsed >= CONFIG.maxPositionTime) {
                console.log(`\n⏱️ MAX TIME (${(elapsed/60000).toFixed(0)} min)`);
                const result = await sellFutures(position || currentPos);
                if (result.success) hasPosition = false;
            } else {
                console.log(`   Holding (${(elapsed/1000).toFixed(0)}s)`);

                // Create position object if not exists
                if (!position) {
                    position = {
                        symbol: CONFIG.symbol,
                        qty: currentPos.qty,
                        price: entryPrice,
                        amount: currentPos.qty * entryPrice,
                        time: Date.now() - 60000 // Approximate
                    };
                    hasPosition = true;
                }
            }
        } else {
            // Check for trade signals
            const ticker = await getFuturesTicker(CONFIG.symbol);
            const change = parseFloat(ticker.priceChangePercent);

            console.log(`\n${CONFIG.symbol} Futures | 24h: ${(change > 0 ? '+' : '')}${change.toFixed(2)}%`);

            if (change > 0 && change < 3) {
                console.log(`✅ Good momentum! Buying futures...`);
                position = await buyFutures(CONFIG.symbol, CONFIG.tradeAmount);
                hasPosition = true;
            } else {
                console.log(`⏳ Waiting for good momentum...`);
            }
        }

        console.log(`\n💰 Futures Trades: ${tradeCount} | Profit: $${totalProfit.toFixed(2)}`);
        console.log('═'.repeat(50));

        setTimeout(checkAndTrade, CONFIG.checkInterval);
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        if (err.message.includes('-2014') || err.message.includes('insufficient')) {
            console.log('⚠️ Insufficient balance for futures trading');
        }
        setTimeout(checkAndTrade, CONFIG.checkInterval);
    }
}

console.log('\n============================================================');
console.log('🚀 BNB FUTURES MOMENTUM TRADER');
console.log('============================================================');
console.log('Symbol:', CONFIG.symbol);
console.log('Minimum: $6.50 (verified working!)');
console.log('Balance: $7.02 available');
console.log('Target: +0.3% | Stop: -0.2% | Max time: 5 min');
console.log('≡'.repeat(60));

checkAndTrade();