const crypto = require('crypto');
const https = require('https');

// Load API keys (same format as aggressive-spot-scalping.js)
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

// Binance Futures API configuration
const BASE_URL = 'fapi.binance.com';
const BASE_PATH = '/fapi';

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
                    const result = JSON.parse(data);
                    if (result.code && result.code !== 200) {
                        reject(new Error(`${result.code}: ${result.msg}`));
                    } else {
                        resolve(result);
                    }
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

console.log('\n============================================================');
console.log('🧪 BNB FUTURES API TEST');
console.log('============================================================\n');

async function testFuturesAPI() {
    try {
        // Test 1: Get Account Balance
        console.log('📊 Test 1: Getting Futures Account Balance...\n');
        const account = await makeRequest('/v2/account');
        const availableBalance = account.availableBalance;
        console.log(`✅ Available Balance: $${availableBalance}\n`);

        // Test 2: Get BNB Futures Exchange Info
        console.log('📋 Test 2: Getting BNBUSDT Futures Exchange Info...\n');
        const exchangeInfo = await getPublicRequest('/v1/exchangeInfo?symbol=BNBUSDT');
        const symbol = exchangeInfo.symbols[0];

        console.log('Symbol: BNBUSDT');
        console.log('Status: ' + symbol.status);
        console.log('\nFilters:');

        symbol.filters.forEach(filter => {
            console.log(`\n  ${filter.filterType}:`);
            for (const key in filter) {
                if (key !== 'filterType') {
                    const val = filter[key];
                    console.log(`    ${key}: ${val}`);
                }
            }
        });

        // Find MIN_NOTIONAL
        const minNotionalFilter = symbol.filters.find(f => f.filterType === 'MIN_NOTIONAL');
        const lotSizeFilter = symbol.filters.find(f => f.filterType === 'LOT_SIZE');
        const priceFilter = symbol.filters.find(f => f.filterType === 'PRICE_FILTER');

        console.log('\n' + '='.repeat(60));
        console.log('💡 SUMMARY:\n');
        console.log(`Available Balance: $${availableBalance}`);
        console.log(`MIN_NOTIONAL: ${minNotionalFilter.notional} USDT`);
        console.log(`Min Quantity: ${lotSizeFilter.minQty} BNB`);
        console.log(`Step Size: ${lotSizeFilter.stepSize} BNB`);
        console.log(`Min Price: $${priceFilter.minPrice}`);
        console.log(`Tick Size: $${priceFilter.tickSize}`);

        // Get current BNB price
        const ticker = await getPublicRequest('/v1/ticker/price?symbol=BNBUSDT');
        const currentPrice = parseFloat(ticker.price);
        console.log(`\nCurrent BNB Price: $${currentPrice.toFixed(2)}`);

        // Calculate minimum order
        const minNotional = parseFloat(minNotionalFilter.notional);
        const minQty = parseFloat(lotSizeFilter.minQty);
        const stepSize = parseFloat(lotSizeFilter.stepSize);
        const tickSize = parseFloat(priceFilter.tickSize);

        // Calculate max possible order with balance
        const maxQtyByNotional = minNotional / currentPrice;
        const maxQtyByBalance = parseFloat(availableBalance) / currentPrice;

        const usableQty = Math.max(maxQtyByNotional, minQty);
        const orderValue = usableQty * currentPrice;

        // Round to step size
        const roundedQty = Math.floor(usableQty / stepSize) * stepSize;
        const roundedValue = roundedQty * currentPrice;

        console.log('\n' + '='.repeat(60));
        console.log('🎯 ORDER CALCULATION:\n');
        console.log(`Min Quantity (by rules): ${minQty} BNB`);
        console.log(`Min Notional ($${minNotional}): ${maxQtyByNotional.toFixed(6)} BNB`);
        console.log(`Max by Balance ($${availableBalance}): ${maxQtyByBalance.toFixed(6)} BNB`);
        console.log(`\nProposed Order: ${roundedQty.toFixed(6)} BNB = $${roundedValue.toFixed(2)}`);

        if (roundedQty >= minQty && roundedValue >= minNotional) {
            console.log('\n✅ ORDER IS VALID - CAN TRADE!\n');
            console.log(`Will test placing order...`);
            
            // Test 3: Place a small order to verify
            const leverage = 1;
            console.log(`\n📋 Test 3: Setting leverage to ${leverage}x...`);
            await makeRequest('/v1/leverage', { symbol: 'BNBUSDT', leverage: leverage });
            console.log(`✅ Leverage set to ${leverage}x`);

            // Place a small MARKET order
            console.log(`\n📋 Test 4: Placing test MARKET BUY order...\n`);
            console.log(`   Symbol: BNBUSDT`);
            console.log(`   Side: BUY`);
            console.log(`   Type: MARKET`);
            console.log(`   Quantity: ${roundedQty.toFixed(6)} BNB`);
            console.log(`   Estimated Value: $${roundedValue.toFixed(2)}`);

            const order = await makeRequest('/v1/order', {
                symbol: 'BNBUSDT',
                side: 'BUY',
                type: 'MARKET',
                quantity: roundedQty.toFixed(6)
            });

            console.log('\n✅ ORDER EXECUTED!\n');
            console.log(`Order ID: ${order.orderId}`);
            console.log(`Filled: ${order.executedQty} BNB`);
            console.log(`Price: $${parseFloat(order.avgPrice || order.price).toFixed(2)}`);
            console.log(`Notional: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}`);

            process.exit(0);
        } else {
            console.log('\n❌ ORDER NOT VALID - CANNOT TRADE\n');
            console.log(`Reason: Quantity ${roundedQty.toFixed(6)} < Minimum ${minQty} OR Value $${roundedValue.toFixed(2)} < Minimum $${minNotional}`);
            process.exit(1);
        }

    } catch (err) {
        console.error(`\n❌ ERROR: ${err.message}\n`);
        console.error('Full error:', err);
        process.exit(1);
    }
}

testFuturesAPI();