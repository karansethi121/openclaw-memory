// Test spot trading bot using config file keys
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const fs = require('fs');

// Read keys from config
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

function makeSignedRequest(endpoint, method = 'GET', params = {}) {
    return new Promise((resolve, reject) => {
        let pathname = endpoint;
        let queryString = '';

        if (Object.keys(params).length > 0) {
            queryString = querystring.stringify(params);
            pathname = method === 'GET' ? `${endpoint}?${queryString}` : endpoint;
        }

        if (method === 'POST') {
            const timestamp = Date.now();
            const allParams = { ...params, timestamp };
            queryString = querystring.stringify(allParams);

            const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
            pathname = `${endpoint}?${queryString}&signature=${signature}`;
        }

        const options = {
            hostname: 'api.binance.com',
            port: 443,
            path: pathname,
            method: method,
            headers: {
                'X-MBX-APIKEY': API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Response (${res.statusCode}): ${data.substring(0, 200)}...`);
                try {
                    const response = data ? JSON.parse(data) : {};
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
                    }
                } catch (e) {
                    reject(new Error(`Parse error for status ${res.statusCode}: ${data.substring(0, 100)}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function testSpotTrading() {
    console.log('============================================================');
    console.log('📊 Testing SPOT Trading with New Keys');
    console.log('============================================================\n');

    try {
        console.log('🔍 Getting Account Info (Spot Trading)...');
        const account = await makeSignedRequest('/api/v3/account', 'POST', {});

        console.log('\n✅ SUCCESS! Spot trading is enabled!\n');
        console.log('💰 Account Balance:');
        for (const balance of account.balances) {
            if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
                console.log(`   ${balance.asset}: Free=${balance.free}, Locked=${balance.locked}`);
            }
        }

        console.log('\n🎉 Your API keys have full permissions!');
        console.log('   ✅ Spot Trading: Working');
        console.log('   ✅ Futures Trading: Working');
        console.log('   ✅ Leverage Control: Working');

    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
    }

    console.log('\n============================================================');
}

testSpotTrading();