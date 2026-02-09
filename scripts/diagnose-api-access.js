// Comprehensive API diagnostic test
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

function makeRequest(hostname, endpoint, method = 'GET', params = {}) {
    return new Promise((resolve, reject) => {
        let pathname = endpoint;
        let queryString = '';

        const timestamp = Date.now();

        if (method === 'GET') {
            const allParams = { ...params, timestamp };
            queryString = Object.keys(allParams)
                .map(key => `${key}=${allParams[key]}`)
                .join('&');

            const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
            pathname = `${endpoint}?${queryString}&signature=${signature}`;
        } else {
            const allParams = { ...params, timestamp };
            queryString = Object.keys(allParams)
                .map(key => `${key}=${encodeURIComponent(allParams[key])}`)
                .join('&');

            const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
            pathname = `${endpoint}?${queryString}&signature=${signature}`;
        }

        const options = {
            hostname: hostname,
            port: 443,
            path: pathname,
            method: method,
            headers: {
                'X-MBX-APIKEY': API_KEY,
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    let response;
                    if (data) {
                        response = JSON.parse(data);
                    }
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

async function diagnose() {
    console.log('============================================================');
    console.log('🔍 COMPREHENSIVE API DIAGNOSTIC');
    console.log('============================================================\n');

    console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');

    const tests = [
        { name: 'SPOT Account Info', hostname: 'api.binance.com', endpoint: '/api/v3/account' },
        { name: 'SPOT Wallet Asset Detail', hostname: 'api.binance.com', endpoint: '/sapi/v1/asset/assetDetail' },
        { name: 'FUTURES Account', hostname: 'fapi.binance.com', endpoint: '/fapi/v2/account' },
        { name: 'Account Status', hostname: 'api.binance.com', endpoint: '/sapi/v1/account/status' },
    ];

    for (const test of tests) {
        console.log(`\n------------------------------------------------------------`);
        console.log(`TEST: ${test.name}`);
        console.log(`URL: https://${test.hostname}${test.endpoint}`);
        console.log('------------------------------------------------------------');

        try {
            const result = await makeRequest(test.hostname, test.endpoint);

            if (result.statusCode === 200) {
                console.log(`✅ SUCCESS (${result.statusCode})`);

                if (test.name === 'SPOT Account Info' && result.data.balances) {
                    const usdt = result.data.balances.find(b => b.asset === 'USDT');
                    if (usdt && (parseFloat(usdt.free) > 0 || parseFloat(usdt.locked) > 0)) {
                        console.log(`   🎉 USDT FOUND!`);
                        console.log(`   Free: ${usdt.free}`);
                        console.log(`   Locked: ${usdt.locked}`);
                        console.log(`   Total: ${(parseFloat(usdt.free) + parseFloat(usdt.locked)).toFixed(2)}`);
                    } else {
                        console.log(`   ✅ Account readable, but USDT balance is 0.00`);
                        console.log(`   Total balances found: ${result.data.balances.length}`);
                    }
                } else if (test.name === 'FUTURES Account') {
                    console.log(`   Available Balance: ${result.data.availableBalance} USDT`);
                    console.log(`   Total Balance: ${result.data.totalWalletBalance} USDT`);
                } else if (test.name === 'Account Status') {
                    console.log(`   Status: ${result.data.data}`);
                } else {
                    console.log(`   Data:`, result.data);
                }
            } else {
                console.log(`❌ FAILED (${result.statusCode})`);
                console.log(`   Error:`, result.data);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }

    console.log('\n============================================================');
    console.log('📋 SUMMARY');
    console.log('============================================================');
}

diagnose();