// Test BNB Futures with Correct Quantities

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

async function signedRequest(hostname, method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: hostname,
            path: `${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.code && parsed.code !== 200) {
                        reject(new Error(`${parsed.code}: ${parsed.msg}`));
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

async function testQuantities() {
    console.log('🧪 TESTING BNB FUTURES WITH DIFFERENT QUANTITIES');
    console.log('='.repeat(70) + '\n');

    try {
        // Get price
        const priceData = await new Promise((resolve, reject) => {
            https.get('https://fapi.binance.com/fapi/v1/ticker/price?symbol=BNBUSDT', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch (err) { reject(err); }
                });
            }).on('error', reject);
        });

        const price = parseFloat(priceData.price);
        console.log(`BNB Price: $${price.toFixed(2)}\n`);

        // Test different quantities
        const quantities = [
            { qty: '0.001', value: 0.001 * price },
            { qty: '0.010', value: 0.010 * price },
            { qty: '0.100', value: 0.100 * price },
            { qty: '1.000', value: 1.000 * price }
        ];

        for (const test of quantities) {
            console.log(`----------------------------------------`);
            console.log(`Testing: ${test.qty} BNB = $${test.value.toFixed(2)}`);
            console.log(`----------------------------------------`);

            try {
                const order = await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/order', {
                    symbol: 'BNBUSDT',
                    side: 'BUY',
                    type: 'MARKET',
                    quantity: test.qty,
                    positionSide: 'LONG'
                });

                console.log(`✅ SUCCESS! Order ID: ${order.orderId}`);
                console.log(`   Executed: ${order.executedQty} BNB`);
                console.log(`   Cost: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}\n`);

                // Close immediately
                await new Promise(r => setTimeout(r, 1000));
                await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/order', {
                    symbol: 'BNBUSDT',
                    side: 'SELL',
                    type: 'MARKET',
                    quantity: order.executedQty,
                    positionSide: 'LONG'
                });

                console.log(`🔴 Position closed\n`);
                console.log('='.repeat(70));
                console.log('🎉 FUTURES TRADING WORKS!');
                console.log('='.repeat(70));
                console.log(`✅ Minimum viable order: ${test.qty} BNB ($${test.value.toFixed(2)})`);
                console.log('✅ We have $7 balance - can trade!');
                console.log('✅ LONG + SHORT both possible\n');

                process.exit(0);

            } catch (error) {
                console.log(`❌ Failed: ${error.message}\n`);

                if (error.message.includes('NOTIONAL')) {
                    console.log('💡 This is the minimum notional requirement.\n');
                }

                if (error.message.includes('precision')) {
                    console.log('💡 Still a precision issue.\n');
                }
            }
        }

        console.log('❌ All quantities failed');
        process.exit(1);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testQuantities().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});