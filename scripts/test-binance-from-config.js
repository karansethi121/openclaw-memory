// Test Binance API connection by reading directly from config file
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const fs = require('fs');

// Read keys directly from config file (not process.env)
const configPath = 'C:\\Users\\Karan\\.openclaw\\openclaw.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

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
            hostname: 'fapi.binance.com',
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

async function testBinanceConnection() {
    console.log('============================================================');
    console.log('🧪 Testing NEW Binance API Keys (from config file)');
    console.log('============================================================\n');

    console.log('🔑 API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
    console.log('🔑 Secret Key (first 10 chars):', API_SECRET.substring(0, 10) + '...\n');

    try {
        console.log('\n📊 TEST: Set BTC/USDT Leverage to 10x');
        console.log('------------------------------------------------------------');
        const result = await makeSignedRequest('leverage', {
            symbol: 'BTCUSDT',
            leverage: 10,
        });

        if (result.leverage === 10 || result.maxNotionalValue) {
            console.log(`\n✅ ✅ ✅ SUCCESS! ✅ ✅ ✅`);
            console.log(`   Leverage set to ${result.leverage}x for BTC/USDT`);
            console.log(`   Max Notional Value: ${result.maxNotionalValue}`);
            console.log('\n🎉 THE NEW API KEYS WORK PERFECTLY!');
            console.log('   You have futures permission and can manage leverage!');
        }

    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);

        if (error.message.includes('401') || error.message.includes('-2015')) {
            console.log('\n💡 This usually means:');
            console.log('   1. IP address restriction is enabled in Binance');
            console.log('   2. Futures permission not actually enabled');
            console.log('\n🔍 To check:');
            console.log('   - Go to Binance API Management');
            console.log('   - Find your new API key (GlKNmdLPBee...)');
            console.log('   - Check if IP restrictions are set');
            console.log('   - Verify "Enable Futures" is actually checked');
        }
    }

    console.log('\n============================================================');
}

testBinanceConnection();