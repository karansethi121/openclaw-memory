const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

async function signedRequest(method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'api.binance.com',
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

async function executeTestTrade() {
    console.log('💰 EXECUTING TEST TRADE TO VERIFY SYSTEM');
    console.log('==========================================\n');

    try {
        // Buy all remaining USDT worth of BTC
        const account = await signedRequest('GET', '/api/v3/account');
        const usdtBal = account.balances.find(b => b.asset === 'USDT');
        const amount = parseFloat(usdtBal.free) - 0.5; // Leave $0.5 buffer
        console.log(`Placing BUY order for $${amount.toFixed(2)} worth of BTC...`);

        const order = await signedRequest('POST', '/api/v3/order', {
            symbol: 'BTCUSDT',
            side: 'BUY',
            type: 'MARKET',
            quoteOrderQty: amount.toFixed(2)
        });

        console.log('✅ ORDER EXECUTED!\n');
        console.log(`Order ID: ${order.orderId}`);
        console.log(`Status: ${order.status}`);
        console.log(`Spent: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}`);
        console.log(`Received: ${parseFloat(order.executedQty).toFixed(6)} BTC`);
        console.log(`Avg Price: $${(parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty)).toFixed(2)}`);

        return order;

    } catch (error) {
        console.error('❌ Trade failed:', error.message);
        throw error;
    }
}

// Execute the test trade
executeTestTrade()
    .then(order => {
        console.log('\n✅ REAL TRADE EXECUTED - SYSTEM WORKING!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ TEST TRADE FAILED');
        console.error('Error:', err.message);
        process.exit(1);
    });