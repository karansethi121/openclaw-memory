// Comprehensive Binance API Test
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;

function makeRequest(url, method = 'GET', params = {}, isSigned = false) {
    return new Promise((resolve, reject) => {
        let pathname = url;
        let requestBody = '';
        let headers = {
            'X-MBX-APIKEY': API_KEY,
        };

        if (method === 'POST') {
            const timestamp = Date.now();
            const queryParams = { ...params, timestamp };
            const queryString = querystring.stringify(queryParams);

            if (isSigned) {
                const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
                pathname += `?${queryString}&signature=${signature}`;
            } else {
                pathname += `?${queryString}`;
            }
        }

        const options = {
            hostname: 'fapi.binance.com',
            port: 443,
            path: pathname,
            method: method,
            headers: headers,
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: response });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function runComprehensiveTest() {
    console.log('============================================================');
    console.log('🧪 COMPREHENSIVE BINANCE API TEST');
    console.log('============================================================\n');

    console.log('🔑 API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
    console.log('🔑 Secret Key (first 10 chars):', API_SECRET.substring(0, 10) + '...\n');

    // Test 1: Account Info (requires Futures permission)
    console.log('------------------------------------------------------------');
    console.log('TEST 1: Get Account Info (requires Futures permission)');
    console.log('------------------------------------------------------------');
    try {
        const result = await makeRequest('/fapi/v2/account', 'GET', {}, true);
        console.log(`Status: ${result.statusCode}`);
        if (result.statusCode === 200) {
            console.log(`✅ SUCCESS! Account info retrieved`);
            console.log(`   Available Balance: ${result.data.availableBalance} USDT`);
            console.log(`   Total Wallet Balance: ${result.data.totalWalletBalance} USDT`);
        } else {
            console.log(`❌ FAILED: ${JSON.stringify(result.data)}`);
            console.log(`   Code -2015 usually means: IP restriction or missing permission`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }

    // Test 2: Set Leverage
    console.log('\n------------------------------------------------------------');
    console.log('TEST 2: Set BTC/USDT Leverage to 10x');
    console.log('------------------------------------------------------------');
    try {
        const result = await makeRequest('/fapi/v1/leverage', 'POST', { symbol: 'BTCUSDT', leverage: 10 }, true);
        console.log(`Status: ${result.statusCode}`);
        if (result.statusCode === 200) {
            console.log(`✅ SUCCESS! Leverage set`);
            console.log(`   Max Notional Value: ${result.data.maxNotionalValue}`);
        } else {
            console.log(`❌ FAILED: ${JSON.stringify(result.data)}`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }

    // Test 3: Get Position Information (requires Futures permission)
    console.log('\n------------------------------------------------------------');
    console.log('TEST 3: Current Positions (requires Futures permission)');
    console.log('------------------------------------------------------------');
    try {
        const result = await makeRequest('/fapi/v2/positionRisk', 'GET', {}, true);
        console.log(`Status: ${result.statusCode}`);
        if (result.statusCode === 200) {
            console.log(`✅ SUCCESS! Retrieved ${result.data.length} positions`);
            const btcPos = result.data.find(p => p.symbol === 'BTCUSDT');
            console.log(`   BTC/USDT Leverage: ${btcPos ? btcPos.leverage : 'N/A'}x`);
        } else {
            console.log(`❌ FAILED: ${JSON.stringify(result.data)}`);
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }

    console.log('\n============================================================');
    console.log('📋 DIAGNOSIS');
    console.log('============================================================');
    console.log(`
If all tests show code -2015:
   → API key PROBABLY only has "Enable Reading" permission
   → Or IP restriction is enabled on Binance

If Account Info (Test 1) works but Leverage (Test 2) fails:
   → Permission issue - "Futures" not enabled

To verify permissions:
   1. Go to Binance API Management
   2. Find your API key
   3. Click "Check Permissions" or similar
   4. Verify all boxes are actually CHECKED (not grayed out)
   5. If grayed out: Create NEW key with all enabled first
   `);
    console.log('============================================================');
}

runComprehensiveTest();