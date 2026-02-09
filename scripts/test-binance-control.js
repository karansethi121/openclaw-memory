// Test Binance API Connection and Set Leverage
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;

function makeSignedRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = querystring.stringify({
            ...params,
            timestamp,
        });

        const signature = crypto
            .createHmac('sha256', API_SECRET)
            .update(queryString)
            .digest('hex');

        const options = {
            hostname: 'fapi.binance.com', // Futures API
            port: 443,
            path: `/fapi/v1/${endpoint}?${queryString}&signature=${signature}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-MBX-APIKEY': API_KEY,
            },
        };

        console.log(`🔗 Request: POST ${endpoint}`);
        console.log(`   Params:`, params);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`   Response (${res.statusCode}):`, JSON.stringify(response, null, 2));

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${response.msg || data}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function testAndSetLeverage() {
    console.log('============================================================');
    console.log('🧪 Testing Binance API Connection & Control');
    console.log('============================================================\n');

    try {
        // Test: Set leverage for BTCUSDT to 10x
        console.log('\n📊 TEST 1: Set BTC/USDT Leverage to 10x');
        console.log('------------------------------------------------------------');
        const leverageResult = await makeSignedRequest('leverage', {
            symbol: 'BTCUSDT',
            leverage: 10,
        });

        if (leverageResult.leverage === 10 || leverageResult.maxNotionalValue) {
            console.log(`\n✅ SUCCESS! Leverage set to ${leverageResult.leverage}x for BTC/USDT`);
            console.log(`   Max Notional Value: ${leverageResult.maxNotionalValue}`);
            console.log('\n🎉 The API keys work and have control permissions!');
        }

    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
        console.log('\n💡 Possible reasons:');
        console.log('   1. API keys are for Spot trading (futures permissions needed)');
        console.log('   2. Trading permissions not enabled on API keys');
        console.log('   3. IP restriction in Binance API settings');
        console.log('   4. API key format or expiration issue');
    }

    console.log('\n============================================================');
    console.log('✅ Test Complete');
    console.log('============================================================');
}

// Run the test
testAndSetLeverage();