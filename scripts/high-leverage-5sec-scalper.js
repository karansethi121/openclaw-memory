// HIGH-LEVERAGE QUICK SCALPER - 5-second trades, max profit
// Uses maximum leverage for quick wins

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

const CONFIG = {
    symbol: 'BNBUSDT',
    leverage: 20, // HIGH LEVERAGE - 20x
    tradeAmount: 6.50,
    targetProfit: 0.0005, // 0.05% - Quick profit
    stopLoss: 0.0005, // 0.05% - Tight stop
    maxHoldTime: 5000, // 5 seconds max!
    checkInterval: 1000, // Check every 1 second
};

let hasPosition = false;
let position = null;
let tradeCount = 0;
let winCount = 0;
let lossCount = 0;
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
                try {
                    const result = JSON.parse(data);
                    if (result.code && result.code !== 200) {
                        reject(new Error(`${result.code}: ${result.msg}`));
                    } else {
                        resolve(result);
                    }
                } catch (err) { reject(err); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function setLeverage(symbol, leverage) {
    try {
        await signedRequest('POST', '/leverage', {
            symbol: symbol,
            leverage: leverage
        });
        console.log(`🎚️  Leverage set to ${leverage}x\n`);
    } catch (err) {
        console.log(`Leverage warning: ${err.message}`);
    }
}

async function getFuturesPrice(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(parseFloat(JSON.parse(data).price)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getTicker24h(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getKlines(symbol, interval = '1s') {
    return new Promise((resolve, reject) => {
        https.get(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=10`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

// Check for 5-second momentum signal
async function getQuickSignal(symbol) {
    try {
        const klines = await getKlines(symbol, '1m');
        if (klines.length < 10) return null;

        // Last 2 candles (1-minute each)
        const last = klines[klines.length - 1];
        const prev = klines[klines.length - 2];

        const lastClose = parseFloat(last[4]);
        const prevClose = parseFloat(prev[4]);
        const lastOpen = parseFloat(last[1]);

        // Strong bullish candle: Close > Open, Green candle
        const greenCandle = lastClose > lastOpen;
        const greenPrev = prevClose > parseFloat(prev[1]);

        // Recent upward push
        const push = (lastClose - prevClose) / prevClose;

        // 24h change
        const ticker = await getTicker24h(symbol);
        const change24h = parseFloat(ticker.priceChangePercent);

        // Quick buy signal conditions
        if (greenCandle && greenPrev && push > 0.001 && change24h > -1 && change24h < 2) {
            return {
                signal: 'BUY',
                reason: `Quick push (${(push*100).toFixed(2)}%)`,
                strength: push * 100
            };
        }

        return null;
    } catch (err) {
        return null;
    }
}

async function buyFutures(symbol, amount) {
    console.log(`\n🚀 BUYING $${amount} of ${symbol} (${CONFIG.leverage}x LEVERAGE)`);
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
        time: Date.now(),
        leverage: CONFIG.leverage
    };
}

async function sellFutures(position) {
    console.log(`\n🔴 SELLING ${position.qty.toFixed(3)} ${position.symbol} (${CONFIG.leverage}x)`);

    const result = await signedRequest('POST', '/order', {
        symbol: position.symbol,
        side: 'SELL',
        type: 'MARKET',
        quantity: position.qty.toFixed(3),
        positionSide: 'LONG'
    });

    const sellPrice = parseFloat(result.avgPrice) || await getFuturesPrice(position.symbol);
    const profit = (sellPrice - position.price) * position.qty * CONFIG.leverage;
    const profitPercent = ((sellPrice - position.price) / position.price) * 100 * CONFIG.leverage;

    tradeCount++;
    totalProfit += profit;
    if (profit > 0) winCount++;
    else lossCount++;

    const emoji = profit > 0 ? '✅' : '❌';
    console.log(`${emoji} SOLD: ${profit > 0 ? '+' : ''}$${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

    return { success: true, profit, profitPercent };
}

async function checkAndTrade() {
    try {
        const currentPrice = await getFuturesPrice(CONFIG.symbol);

        if (hasPosition && position) {
            const profitPercent = ((currentPrice - position.price) / position.price) * 100;
            const elapsed = Date.now() - position.time;

            console.log(`   Position: ${(profitPercent > 0 ? '+' : '')}${profitPercent.toFixed(3)}% | Time: ${(elapsed/1000).toFixed(1)}s/${(CONFIG.maxHoldTime/1000)}s`);

            // Quick profit or stop loss or max time
            if (profitPercent >= CONFIG.targetProfit * 100 * CONFIG.leverage ||
                profitPercent <= -CONFIG.stopLoss * 100 * CONFIG.leverage ||
                elapsed >= CONFIG.maxHoldTime) {

                const reason = profitPercent >= CONFIG.targetProfit * 100 * CONFIG.leverage ? 'TAKE PROFIT' :
                             elapsed >= CONFIG.maxHoldTime ? 'TIME UP' : 'STOP LOSS';
                console.log(`\n🎯 ${reason}!`);
                const result = await sellFutures(position);
                hasPosition = false;
                position = null;
            }
        } else {
            console.log(`\n${CONFIG.symbol}: $${currentPrice.toFixed(2)} | Scanning for 5s signals...`);

            const signal = await getQuickSignal(CONFIG.symbol);
            if (signal && signal.signal === 'BUY') {
                console.log(`✅ ${signal.reason}`);
                position = await buyFutures(CONFIG.symbol, CONFIG.tradeAmount);
                hasPosition = true;
            }
        }

        const winRate = tradeCount > 0 ? ((winCount / tradeCount) * 100).toFixed(1) : 0;
        console.log(`\n💰 Trades: ${tradeCount} | W:${winCount} L:${lossCount} | WinRate: ${winRate}% | Profit: $${totalProfit.toFixed(2)}`);
        console.log('═'.repeat(50));

        setTimeout(checkAndTrade, CONFIG.checkInterval);
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        hasPosition = false;
        position = null;
        setTimeout(checkAndTrade, CONFIG.checkInterval);
    }
}

console.log('\n============================================================');
console.log('⚡ HIGH-LEVERAGE QUICK SCALPER (5-SEC TRADES)');
console.log('============================================================');
console.log('Leverage:', CONFIG.leverage + 'x', '| Max hold: 5 seconds');
console.log('Target: +0.05% (leveraged)', '| Stop: -0.05% (leveraged)');
console.log('Speed: 1s checks | Quick profit capture!');
console.log('≡'.repeat(60));

setLeverage(CONFIG.symbol, CONFIG.leverage);
checkAndTrade();