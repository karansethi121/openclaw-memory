const https = require('https');

async function testPublicFuturesEndpoint() {
    console.log('🔍 Testing Futures API Endpoints\n');

    // Try public endpoint first
    https.get('https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log('✅ Public Futures API: WORKING');
                console.log(`   BTCUSDT Price: ${parseFloat(result.price).toFixed(2)}\n`);
            } catch (err) {
                console.log('❌ Public Futures API: FAILED');
                console.log(`   Response (first 200 chars): ${data.substring(0, 200)}\n`);
            }
        });
    }).on('error', (err) => {
        console.log('❌ Public Futures API: ERROR');
        console.log(`   Error: ${err.message}\n`);
    });

    // Try premium index endpoint
    https.get('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log('✅ Premium Index API: WORKING');
                console.log(`   Mark Price: ${parseFloat(result.markPrice).toFixed(2)}`);
                console.log(`   Funding Rate: ${(parseFloat(result.lastFundingRate) * 100).toFixed(4)}%\n`);
            } catch (err) {
                console.log('❌ Premium Index API: FAILED');
                const trimmed = data.substring(0, 200);
                console.log(`   Response (first 200 chars): ${trimmed}\n`);
            }
        });
    }).on('error', (err) => {
        console.log('❌ Premium Index API: ERROR');
        console.log(`   Error: ${err.message}\n`);
    });
}

testPublicFuturesEndpoint();
setTimeout(() => process.exit(0), 3000);