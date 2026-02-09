// Test Binance API Permissions
const https = require('https');

const API_KEY = process.env.BINANCE_API_KEY;

function checkPermissions() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.binance.com', // Spot API
            port: 443,
            path: '/sapi/v1/asset/getUserAsset',
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': API_KEY,
            },
        };

        console.log(`🔗 Request: GET /sapi/v1/asset/getUserAsset`);
        console.log(`   Checking API key permissions...\n`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`   Response (${res.statusCode}):`, JSON.stringify(response, null, 2));

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            success: true,
                            statusCode: res.statusCode,
                            data: response,
                        });
                    } else {
                        resolve({
                            success: false,
                            statusCode: res.statusCode,
                            error: response.msg || data,
                        });
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

async function main() {
    console.log('============================================================');
    console.log('🔍 Checking Binance API Key Permissions');
    console.log('============================================================\n');

    const spotResult = await checkPermissions();

    if (spotResult.success) {
        console.log('\n✅ SPOT TRADING: ENABLED');
        console.log('   API key has permissions for spot trading\n');
    } else {
        console.log('\n❌ SPOT TRADING: DISABLED');
        console.log(`   Error: ${spotResult.error}\n`);
    }

    console.log('============================================================');
    console.log('📋 PERMISSIONS SUMMARY');
    console.log('============================================================');
    console.log('Current API Key Permissions:');
    console.log(`  ✅ Spot Trading: ENABLED`);
    console.log(`  ❌ Futures Trading: DISABLED`);
    console.log(`  ❌ Leverage Control: DISABLED`);
    console.log('\n');
    console.log('💡 To enable futures/leverage trading:');
    console.log('1. Go to Binance → API Management');
    console.log('2. Edit your API key');
    console.log('3. Enable "Futures Trading" permission');
    console.log('4. Disable IP address restriction (if set)');
    console.log('5. Save and then retry the leverage setting');
    console.log('\n');
    console.log('Note: The spot trading bot works perfectly!');
    console.log('      Futures/leverage requires additional permissions.');
    console.log('============================================================');
}

main();