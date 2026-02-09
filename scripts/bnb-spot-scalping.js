const crypto = require('crypto');
const https = require('https');

// Load API keys
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.binance?.apiKey || '';
const API_SECRET = config.binance?.apiSecret || '';

// Binance Spot API configuration
const BASE_URL = 'api.binance.com';
const BASE_PATH = '/api';

function getSignature(queryString) {
    return crypto
        .createHmac('sha256', API_SECRET)
        .update(queryString)
        .digest('hex');
}

async function makeRequest(path, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = Object.entries({ ...params, timestamp })
            .map(([k, v]) => `${k}=${v}`)
            .join('&');

        const signature = getSignature(queryString);
        const url = `https://${BASE_URL}${BASE_PATH}${path}?${queryString}&signature=${signature}`;

        https.get(url, {
            headers: {
                'X-MBX-APIKEY': API_KEY
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getPublicRequest(path) {
    return new Promise((resolve, reject) => {
        https.get(`https://${BASE_URL}${BASE_PATH}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getBNBTicker() {
    const data = await getPublicRequest('/v3/ticker/price?symbol=BNBUSDT');
    return parseFloat(data.price);
}

async function getAccountInfo() {
    try {
        const data = await makeRequest('/v3/account');
        if (!data || !data.balances) {
            console.error('❌ Account data invalid:', JSON.stringify(data));
            throw new Error('Invalid account data');
        }
        const usdtBalance = data.balances.find(b => b.asset === 'USDT');
        if (!usdtBalance) {
            console.error('❌ USDT balance not found');
            throw new Error('USDT balance not found');
        }
        return parseFloat(usdtBalance.free);
    } catch (err) {
        console.error(`Error getting account info: ${err.message}`);
        throw err;
    }
}

async function getExchangeInfo() {
    const data = await getPublicRequest('/v3/exchangeInfo?symbol=BNBUSDT');
    const symbol = data.symbols[0];

    // Find filters
    const lotSize = symbol.filters.find(f => f.filterType === 'LOT_SIZE');
    const minNotional = symbol.filters.find(f => f.filterType === 'MIN_NOTIONAL');
    const priceFilter = symbol.filters.find(f => f.filterType === 'PRICE_FILTER');

    return {
        minQty: parseFloat(lotSize.minQty),
        stepSize: parseFloat(lotSize.stepSize),
        minNotional: parseFloat(minNotional.minNotional),
        tickSize: parseFloat(priceFilter.tickSize)
    };
}

function roundToStep(value, step) {
    return Math.floor(value / step) * step;
}

function roundPrice(value, tick) {
    return Math.floor(value / tick) * tick;
}

async function placeOrder(symbol, side, type, quantity, price = null) {
    const params = {
        symbol,
        side, // BUY or SELL
        type  // MARKET or LIMIT
    };

    if (type === 'LIMIT') {
        params.timeInForce = 'GTC';
        params.price = price.toString();
    }

    params.quantity = quantity.toString();

    return await makeRequest('/v3/order', params);
}

// BNB Spot Scalping Bot Configuration
const CONFIG = {
    symbol: 'BNBUSDT',
    positionSizeUsdt: 5.00,  // $5 per trade (minimum)
    targetProfit: 0.003,     // +0.3%
    stopLoss: 0.0015,        // -0.15%
    checkInterval: 5000,     // 5 seconds
    maxCycle: 120000,        // 2 minutes max hold
    targetTrades: 20
};

let currentPosition = null;
let tradeCount = 0;
let totalProfit = 0;
let startTime = Date.now();

console.log('\n============================================================');
console.log('⚡ BNB SPOT SCALPING BOT');
console.log('============================================================\n');
console.log(`Symbol: ${CONFIG.symbol}`);
console.log(`Position Size: $${CONFIG.positionSizeUsdt}`);
console.log(`Target Profit: +${(CONFIG.targetProfit * 100).toFixed(1)}%`);
console.log(`Stop Loss: -${(CONFIG.stopLoss * 100).toFixed(2)}%`);
console.log(`Check Interval: ${CONFIG.checkInterval / 1000} seconds`);
console.log(`Max Cycle: ${CONFIG.maxCycle / 1000} seconds\n`);

async function runBot() {
    try {
        // Get balance and price
        const balance = await getAccountInfo();
        const currentPrice = await getBNBTicker();
        const exchangeInfo = await getExchangeInfo();

        console.log(`💰 Balance: $${balance.toFixed(2)} | Trades: ${tradeCount} | Total Profit: $${totalProfit.toFixed(2)} | Time: ${Math.floor((Date.now() - startTime) / 1000)}s\n`);

        // Calculate position size
        const quantity = roundToStep(CONFIG.positionSizeUsdt / currentPrice, exchangeInfo.stepSize);
        const entryPrice = roundPrice(currentPrice, exchangeInfo.tickSize);
        const value = quantity * entryPrice;

        if (value < exchangeInfo.minNotional) {
            console.log(`⚠️ Position too small. Min: $${exchangeInfo.minNotional}, Value: $${value.toFixed(2)}`);
            console.log('Waiting for higher price...\n');
        } else {
            // Calculate targets
            const takeProfitPrice = entryPrice * (1 + CONFIG.targetProfit);
            const stopLossPrice = entryPrice * (1 - CONFIG.stopLoss);

            console.log(`   BNB Price: $${currentPrice.toFixed(2)}`);
            console.log(`   Min Order: $${exchangeInfo.minNotional}`);
            console.log(`   Calculated Qty: ${quantity.toFixed(exchangeInfo.stepSize.toString().split('.')[1]?.length || 0)} BNB`);
            console.log(`   Value: $${value.toFixed(2)}\n`);

            if (!currentPosition && quantity >= exchangeInfo.minQty) {
                // Open Position
                console.log('============================================================');
                console.log('🟢 EXECUTING BUY');
                console.log('============================================================\n');
                console.log(`   Price: $${currentPrice.toFixed(2)}`);
                console.log(`   Quantity: ${quantity} BNB`);
                console.log(`   Value: $${value.toFixed(2)}\n`);

                const order = await placeOrder('BNBUSDT', 'BUY', 'MARKET', quantity);

                if (order.orderId) {
                    console.log(`✅ POSITION OPENED`);
                    console.log(`   Entry: ${order.executedQty} @ $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}`);
                    console.log(`   Cost: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}`);
                    console.log(`   Take Profit: $${(takeProfitPrice * quantity).toFixed(2)}`);
                    console.log(`   Stop Loss: $${(stopLossPrice * quantity).toFixed(2)}\n`);

                    currentPosition = {
                        entryPrice: parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty),
                        quantity: parseFloat(order.executedQty),
                        takeProfitPrice,
                        stopLossPrice,
                        timestamp: Date.now(),
                        orderId: order.orderId
                    };
                } else {
                    console.log(`❌ ORDER FAILED: ${JSON.stringify(order)}\n`);
                }
            }

            // Monitor Position
            if (currentPosition) {
                const elapsed = Date.now() - currentPosition.timestamp;
                const plPercent = (currentPrice - currentPosition.entryPrice) / currentPosition.entryPrice;
                const plValue = plPercent * (currentPosition.quantity * currentPosition.entryPrice);

                console.log(`⏳ HOLDING - Price: $${currentPrice.toFixed(2)} | P/L: ${(plPercent * 100).toFixed(3)}% ($${plValue.toFixed(2)}) | ${Math.floor(elapsed / 1000)}s`);

                // CheckExit Conditions
                if (currentPrice >= currentPosition.takeProfitPrice) {
                    console.log(`🎯 TAKE PROFIT HIT!`);
                    await closePosition('TAKE PROFIT');
                } else if (currentPrice <= currentPosition.stopLossPrice) {
                    console.log(`🎯 STOP LOSS HIT!`);
                    await closePosition('STOP LOSS');
                } else if (elapsed >= CONFIG.maxCycle) {
                    console.log(`🎯 TIME STOP HIT!`);
                    await closePosition('TIME STOP');
                } else {
                    console.log('');
                }
            }
        }
    } catch (err) {
        console.error(`Error: ${err.message}\n`);
    }
}

async function closePosition(reason) {
    console.log('\n============================================================');
    console.log('🔴 EXECUTING SELL');
    console.log('============================================================\n');

    try {
        const currentPrice = await getBNBTicker();
        const exchangeInfo = await getExchangeInfo();
        const sellQuantity = roundToStep(currentPosition.quantity, exchangeInfo.stepSize);

        const order = await placeOrder('BNBUSDT', 'SELL', 'MARKET', sellQuantity);

        if (order.orderId) {
            const exitPrice = parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty);
            const profit = parseFloat(order.cummulativeQuoteQty) - (currentPosition.quantity * currentPosition.entryPrice);
            const profitPercent = (profit / (currentPosition.quantity * currentPosition.entryPrice)) * 100;
            const duration = (order.transactTime - currentPosition.timestamp) / 1000;

            console.log(`✅ TRADE CLOSED`);
            console.log(`   Entry: $${currentPosition.entryPrice.toFixed(2)}`);
            console.log(`   Exit: $${exitPrice.toFixed(2)}`);
            console.log(`   Revenue: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}`);
            console.log(`   Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(3)}%)`);
            console.log(`   Duration: ${duration.toFixed(1)}s`);
            console.log(`   Reason: ${reason}\n`);

            const balance = await getAccountInfo();
            tradeCount++;
            totalProfit += profit;

            console.log(`💰 Balance: $${balance.toFixed(2)} | Trades: ${tradeCount} | Total Profit: $${totalProfit.toFixed(2)} | Target: $${CONFIG.targetTrades}\n`);

            currentPosition = null;

            // Check if target reached
            if (tradeCount >= CONFIG.targetTrades) {
                console.log('============================================================');
                console.log('🎉 TARGET REACHED!');
                console.log('============================================================\n');
                console.log(`Total Trades: ${tradeCount}`);
                console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
                console.log(`Win Rate: TBD`);
                console.log(`Duration: ${Math.floor((Date.now() - startTime) / 60000)} minutes\n`);
                process.exit(0);
            }
        } else {
            console.log(`❌ SELL FAILED: ${JSON.stringify(order)}\n`);
        }
    } catch (err) {
        console.error(`Error closing position: ${err.message}\n`);
    }
}

// Main loop
setInterval(runBot, CONFIG.checkInterval);

console.log('🚀 BNB Scalping Bot Started...\n');

// Initial run
runBot();