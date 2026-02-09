const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

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
console.log('🔄 CONSOLIDATING FUNDS FOR TRADING');
console.log('============================================================\n');

async function sellNEAR() {
    try {
        console.log('Step 1: Checking NEAR balance...');

        const account = await signedRequest('api.binance.com', 'GET', '/account');
        const nearBalance = account.balances.find(b => b.asset === 'NEAR');
        const nearQty = parseFloat(nearBalance.free);

        console.log(`   NEAR: ${nearQty.toFixed(4)}\n`);

        if (nearQty < 0.01) {
            console.log('⚠️ Insufficient NEAR to sell\n');
            return;
        }

        console.log('Step 2: Selling NEAR for USDT...');

        const result = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
            symbol: 'NEARUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: nearQty.toFixed(4)
        });

        console.log(`\n✅ SOLD ${result.executedQty} NEAR`);
        console.log(`   Received: $${result.cummulativeQuoteQty} USDT`);
        console.log('\n📊 Funds consolidated for trading!\n');

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
    }
}

sellNEAR();