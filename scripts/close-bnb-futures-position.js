const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function makeRequest(method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v1${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.code && result.code !== 200) {
                        reject(new Error(`${result.code}: ${result.msg}`));
                    } else {
                        resolve(result);
                    }
                } catch (err) { reject(err); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

console.log('\n============================================================');
console.log('🔴 ATTEMPTING TO CLOSE INVALID BNB FUTURES POSITION');
console.log('============================================================\n');

async function closePosition() {
    try {
        console.log('Step 1: Cancelling all open orders...');
        try {
            await makeRequest('DELETE', '/openOrders', { symbol: 'BNBUSDT' });
            console.log('✅ Orders cancelled\n');
        } catch (err) {
            console.log(`ℹ️ No orders to cancel or error: ${err.message}\n`);
        }

        console.log('Step 2: Closing BNBUSDT LONG position...');
        console.log('   Symbol: BNBUSDT');
        console.log('   Side: SELL (closing LONG)');
        console.log('   Type: MARKET');
        console.log('   Quantity: 0.01\n');

        const result = await makeRequest('POST', '/order', {
            symbol: 'BNBUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: '0.01',
            reduceOnly: 'true'  // Close position only, don't open new one
        });

        console.log('✅ ORDER EXECUTED!\n');
        console.log(`Order ID: ${result.orderId}`);
        console.log(`Filled: ${result.executedQty || '0'} BNB`);
        console.log(`Price: $${result.avgPrice || result.price}`);
        console.log(`Notional: $${result.cummulativeQuoteQty}`);

        console.log('\n\n' + '='.repeat(60));
        console.log('🎯 POSITION CLOSED');
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
        console.log('Possible reasons:');
        console.log('  1. Position already closed');
        console.log('  2. Invalid position data (corrupted trade)');
        console.log('  3. Need to use different order parameters\n');
        process.exit(1);
    }
}

closePosition();