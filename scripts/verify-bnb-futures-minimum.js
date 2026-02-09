const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function makeRequest(method, endpoint, params = {}) {
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

async function checkBNBFuturesRules() {
    console.log('\n============================================================');
    console.log('🔍 BNB FUTURES MINIMUM CHECK');
    console.log('============================================================\n');

    try {
        // Method 1: Check exchange info
        console.log('Step 1: Getting exchange info for BNB futures...\n');
        const exchangeInfo = await makeRequest('GET', '/exchangeInfo', { symbol: 'BNBUSDT' });

        console.log('Exchange Info:');
        const symbolInfo = exchangeInfo.symbolFilters.find(f => f.filterType === 'NOTIONAL');
        if (symbolInfo) {
            console.log(`  Filter NOTIONAL: ${JSON.stringify(symbolInfo)}`);
            console.log(`  Min Notional: $${symbolInfo?.minNotional || 'N/A'}`);
        }

        // Method 2: Check current price
        console.log('\nStep 2: Getting current BNB futures price...\n');
        const priceRes = await new Promise((resolve, reject) => {
            https.get('https://fapi.binance.com/fapi/v1/ticker/price?symbol=BNBUSDT', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch (err) { reject(err); }
                });
            }).on('error', reject);
        });

        console.log(`  Current Price: $${priceRes.price}`);

        // Method 3: Test if $6.50 order would work
        console.log('\nStep 3: Testing if $6.50 order is valid...\n');
        const testAmount = 6.50;
        const testQty = (testAmount / parseFloat(priceRes.price)).toFixed(3);

        console.log(`  Test Order: BUY $${testAmount} of BNBUSDT`);
        console.log(`  Test Quantity: ${testQty} BNB`);

        // Method 4: Actual small test order
        console.log('\nStep 4: Attempting real small order to verify...\n');
        try {
            console.log('  Attempting: BUY 0.001 BNB (approximately $0.65)...');
            const result = await makeRequest('POST', '/order/test', {
                symbol: 'BNBUSDT',
                side: 'BUY',
                type: 'MARKET',
                quantity: '0.001'
            });
            console.log('  ✅ Test order accepted - Minimum is NOT $100!\n');
        } catch (err) {
            console.log(`  ❌ Test order failed: ${err.message}\n`);
        }

        console.log('============================================================');
        console.log('CONCLUSION:');
        console.log('============================================================\n');
        console.log('User says: Minimum is $6.50');
        console.log('API filters show MIN_NOTIONAL value above');
        console.log('Actual test order will reveal true minimum\n');

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
    }
}

checkBNBFuturesRules();