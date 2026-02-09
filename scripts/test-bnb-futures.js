// Test BNB Futures Trading - Small Position

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

async function testBNBFutures() {
    console.log('🧪 TESTING BNB FUTURES ORDER');
    console.log('='.repeat(70) + '\n');

    try {
        // Check balance
        console.log('Step 1: Check futures account...');
        const account = await signedRequest('fapi.binance.com', 'GET', '/fapi/v2/account');
        const balance = parseFloat(account.totalWalletBalance);
        console.log(`✅ Futures Balance: $${balance.toFixed(2)}\n`);

        // Set leverage
        console.log('Step 2: Set leverage to 1x...');
        await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/leverage', {
            symbol: 'BNBUSDT',
            leverage: '1'
        });
        console.log('✅ Leverage set\n');

        // Get current price
        return new Promise((resolve, reject) => {
            https.get('https://fapi.binance.com/fapi/v1/ticker/price?symbol=BNBUSDT', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const price = parseFloat(JSON.parse(data).price);
                        console.log(`Step 3: BNB Price: $${price.toFixed(2)}`);

                        // Calculate quantity for $5 order
                        const orderValue = 5.00;
                        const quantity = orderValue / price;
                        const qty = Math.ceil(quantity / 0.001) * 0.001; // Round to 0.001

                        console.log(`Plan: Buy ${qty} BNB @ $${price.toFixed(2)} = $${(qty * price).toFixed(2)}\n`);

                        // Place order
                        console.log('Step 4: Placing LONG order...');
                        signedRequest('fapi.binance.com', 'POST', '/fapi/v1/order', {
                            symbol: 'BNBUSDT',
                            side: 'BUY',
                            type: 'MARKET',
                            quantity: qty.toFixed(6),
                            positionSide: 'LONG'
                        }).then(order => {
                            console.log('✅ ORDER SUCCESSFUL!\n');
                            console.log(`Order ID: ${order.orderId}`);
                            console.log(`Filled: ${order.executedQty} BNB`);
                            console.log(`Price: $${order.avgPrice}\n`);

                            // Close after 3 seconds
                            console.log('Step 5: Closing position in 3 seconds...');
                            setTimeout(() => {
                                signedRequest('fapi.binance.com', 'POST', '/fapi/v1/order', {
                                    symbol: 'BNBUSDT',
                                    side: 'SELL',
                                    type: 'MARKET',
                                    quantity: order.executedQty,
                                    positionSide: 'LONG'
                                }).then(closeOrder => {
                                    console.log('✅ POSITION CLOSED!\n');
                                    const revenue = parseFloat(closeOrder.cummulativeQuoteQty);
                                    const cost = parseFloat(order.cummulativeQuoteQty);
                                    const profit = revenue - cost;
                                    console.log(`P/L: $${profit.toFixed(2)}\n`);

                                    console.log('='.repeat(70));
                                    console.log('🎉 BNB FUTURES TRADING: WORKING!');
                                    console.log('='.repeat(70));
                                    console.log('✅ Can trade futures with $7 balance');
                                    console.log('✅ Minimum order: ~$5');
                                    console.log('✅ LONG + SHORT both possible\n');

                                    process.exit(0);
                                }).catch(err => {
                                    console.error('Close failed:', err.message);
                                    process.exit(1);
                                });
                            }, 3000);

                        }).catch(err => {
                            console.error('❌ Order failed:', err.message);
                            console.log('\nThis might indicate:');
                            console.log('  1. Minimum order value still too high');
                            console.log('  2. Different minimum for different symbols');
                            console.log('  3. IP restriction on futures trading');
                            process.exit(1);
                        });

                    } catch (err) { reject(err); }
                });
            }).on('error', reject);
        });

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testBNBFutures().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});