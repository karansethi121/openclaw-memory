// Funding Rate Arbitrage Bot - 24/7 Passive Income
// Earn funding rate premium every 8 hours by hedging spot with futures

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY_FUTURES = config.env.BINANCE_API_KEY;
const API_SECRET_FUTURES = config.env.BINANCE_API_SECRET;

let SPOT_KEY = null;
let SPOT_SECRET = null;
if (config.env.BINANCE_SPOT_API_KEY && config.env.BINANCE_SPOT_API_SECRET) {
    SPOT_KEY = config.env.BINANCE_SPOT_API_KEY;
    SPOT_SECRET = config.env.BINANCE_SPOT_API_SECRET;
}

// Configuration
const CONFIG = {
    capital: 7.00, // Capital for funding arbitrage
    symbols: ['BTCUSDT', 'ETHUSDT'], // Test multiple symbols
    minFundingRate: 0.0002, // Minimum funding rate to activate (0.02%)
    leverage: 2, // Leverage for futures (0.5x effective hedge after spot)
    rebalanceThreshold: 0.01, // Rebalance if price moves 1%
    checkInterval: 30000 // Check every 30 seconds
};

let totalFundingEarned = 0;
let fundingPayments = [];

async function signedRequest(hostname, apiKey, apiSecret, method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');

        const options = {
            hostname: hostname,
            path: `${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': apiKey }
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

// Get account balance
async function getAccount(apiKey, apiSecret, hostname) {
    return await signedRequest(hostname, apiKey, apiSecret, 'GET', '/api/v3/account');
}

// Get futures account
async function getFuturesAccount() {
    return await signedRequest('fapi.binance.com', API_KEY_FUTURES, API_SECRET_FUTURES, 'GET', '/fapi/v2/account');
}

// Get current funding rates
async function getFundingRates(symbols) {
    return new Promise((resolve, reject) => {
        https.get('https://fapi.binance.com/fapi/v1/premiumIndex', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const allFunding = JSON.parse(data);
                    const result = {};
                    for (const item of allFunding) {
                        if (symbols.includes(item.symbol)) {
                            result[item.symbol] = {
                                fundingRate: parseFloat(item.lastFundingRate),
                                nextFundingTime: item.nextFundingTime,
                                markPrice: parseFloat(item.markPrice),
                                indexPrice: parseFloat(item.indexPrice)
                            };
                        }
                    }
                    resolve(result);
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

// Spot buy order
async function placeSpotBuy(symbol, amount) {
    return await signedRequest('api.binance.com', API_KEY_FUTURES, API_SECRET_FUTURES, 'POST', '/api/v3/order', {
        symbol: symbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: amount.toFixed(2)
    });
}

// Futures short order
async function placeFuturesShort(symbol, amount) {
    return await signedRequest('fapi.binance.com', API_KEY_FUTURES, API_SECRET_FUTURES, 'POST', '/fapi/v2/order', {
        symbol: symbol,
        side: 'SELL',
        type: 'MARKET',
        quoteOrderQty: amount.toFixed(2)
    });
}

// Get current price
async function getPrice(symbol, spot = true) {
    return new Promise((resolve, reject) => {
        const hostname = spot ? 'api.binance.com' : 'fapi.binance.com';
        const endpoint = spot ? '/api/v3/ticker/price' : '/fapi/v1/ticker/price';
        https.get(`https://${hostname}${endpoint}?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(parseFloat(JSON.parse(data).price));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

function formatTime(uts) {
    return new Date(uts).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
}

async function monitorFundingArbitrage() {
    try {
        const fundingRates = await getFundingRates(CONFIG.symbols);

        console.log('\n' + '='.repeat(80));
        console.log('💰 FUNDING RATE ARBITRAGE - 24/7 PASSIVE INCOME');
        console.log('='.repeat(80));
        console.log(`\n⏰ ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
        console.log(`💰 Total Funding Earned: $${totalFundingEarned.toFixed(4)}\n`);

        for (const symbol of CONFIG.symbols) {
            const funding = fundingRates[symbol];
            if (!funding) continue;

            const annualRate = funding.fundingRate * 3 * 365 * 100; // 3 times daily
            const dailyUSD = CONFIG.capital * funding.fundingRate * 3;
            const nextFunding = formatTime(funding.nextFundingTime);

            console.log(`${symbol}:`);
            console.log(`   Funding Rate: ${(funding.fundingRate * 100).toFixed(4)}% (Annual: ${annualRate.toFixed(2)}%)`);
            console.log(`   Daily Profit: $${dailyUSD.toFixed(4)}`);
            console.log(`   Next Funding: ${nextFunding} IST`);
            console.log(`   Price: $${funding.markPrice.toFixed(2)}\n`);

            if (funding.fundingRate >= CONFIG.minFundingRate) {
                console.log(`   ✅ FUNDING OPPORTUNITY! Rate ${(funding.fundingRate * 100).toFixed(3)}% >= ${(CONFIG.minFundingRate * 100).toFixed(2)}%\n`);
            } else {
                console.log(`   ⏳ Waiting for higher funding rate...\n`);
            }
        }

        console.log('='.repeat(80));
        console.log(`💡 Next check in ${CONFIG.checkInterval / 1000} seconds\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function runContinuous() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 FUNDING RATE ARBITRAGE - CONTINUOUS MONITORING');
    console.log('='.repeat(80));
    console.log(`\nConfiguration:`);
    console.log(`  Capital: $${CONFIG.capital}`);
    console.log(`  Symbols: ${CONFIG.symbols.join(', ')}`);
    console.log(`  Min Funding Rate: ${(CONFIG.minFundingRate * 100).toFixed(2)}%`);
    console.log(`  Check Interval: ${CONFIG.checkInterval / 1000}s`);
    console.log(`  Next Funding Times: 5:30 AM, 1:30 PM, 9:30 PM IST`);

    // Initial check
    monitorFundingArbitrage();

    // Continuous monitoring
    setInterval(() => {
        monitorFundingArbitrage();
    }, CONFIG.checkInterval);
}

// Simple mode: Just monitor funding rates
if (process.argv[2] === 'monitor') {
    runContinuous();
} else {
    // Default: Monitor and alert on opportunities
    runContinuous();
}

module.exports = { CONFIG, getFundingRates, monitorFundingArbitrage };