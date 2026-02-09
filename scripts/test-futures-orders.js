// Simple Futures Test - Debug Order Placement

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
                console.log(`Status Code: ${res.statusCode}`);
                console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}\n`);

                if (res.statusCode !== 200) {
                    console.log(`Response (first 500 chars): ${data.substring(0, 500)}`);
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
                    return;
                }

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.code && parsed.code !== 200) {
                        reject(new Error(`Error ${parsed.code}: ${parsed.msg}`));
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

async function testFuturesOrder() {
    console.log('🔍 TESTING FUTURES ORDER PLACEMENT');
    console.log('======================================\n');

    try {
        // 1. Test account first
        console.log('Step 1: Check futures account...');
        const account = await signedRequest('fapi.binance.com', 'GET', '/fapi/v2/account');
        console.log(`✅ Account OK. Balance: $${parseFloat(account.totalWalletBalance).toFixed(2)}\n`);

        // 2. Set position mode to hedge (allows both LONG and SHORT)
        console.log('Step 2: Set position mode to HEDGED...');
        try {
            await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/positionSide/dual', {
                dualSidePosition: 'true'
            });
            console.log('✅ Position mode set to HEDGED\n');
        } catch (err) {
            if (err.message.includes('already set')) {
                console.log('✅ Position mode already HEDGED\n');
            } else {
                console.log(`⚠️  Position mode warning: ${err.message}\n`);
            }
        }

        // 3. Set leverage
        console.log('Step 3: Set leverage to 1x...');
        await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/leverage', {
            symbol: 'BTCUSDT',
            leverage: '1'
        });
        console.log('✅ Leverage set to 1x\n');

        // 4. Try SMALL LONG order (min quantity 0.001)
        console.log('Step 4: Place LONG order (0.001 BTC - $67.66)...');
        const longOrder = await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/order', {
            symbol: 'BTCUSDT',
            side: 'BUY',
            type: 'MARKET',
            quantity: '0.001',
            positionSide: 'LONG'
        });

        console.log('✅ LONG ORDER SUCCESSFUL!\n');
        console.log(`Order ID: ${longOrder.orderId}`);
        console.log(`Filled: ${longOrder.executedQty} BTC`);
        console.log(`Price: $${parseFloat(longOrder.avgPrice || longOrder.price).toFixed(2)}`);
        console.log(`Value: $${parseFloat(longOrder.cummulativeQuoteQty).toFixed(2)}`);

        // Wait 3 seconds
        await new Promise(r => setTimeout(r, 3000));

        // 5. Close the position
        console.log('\nStep 5: Close LONG position...');
        const closeOrder = await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/order', {
            symbol: 'BTCUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: longOrder.executedQty,
            positionSide: 'LONG'
        });

        console.log('✅ POSITION CLOSED!\n');
        const profit = parseFloat(closeOrder.cummulativeQuoteQty) - parseFloat(longOrder.cummulativeQuoteQty);
        console.log(`P/L: $${profit.toFixed(4)}`);

        console.log('\n✅ FUTURES TRADING: WORKING!');
        return { success: true, longOrder, closeOrder, profit };

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nThis might indicate:');
        console.error('  1. API keys not enabled for futures');
        console.error('  2. IP restriction');
        console.error('  3. Minimum order size issue');
        return { success: false, error: error.message };
    }
}

testFuturesOrder()
    .then(result => {
        process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    });