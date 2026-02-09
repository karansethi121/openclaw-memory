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
console.log('🧪 TESTING BNB FUTURES MINIMUM (User says: $6.50)');
console.log('============================================================\n');

async function testOrder() {
    try {
        // Get current BNB futures price
        console.log('Current BNB futures price...');
        const price = await new Promise((resolve, reject) => {
            https.get('https://fapi.binance.com/fapi/v1/ticker/price?symbol=BNBUSDT', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch (err) { reject(err); }
                });
            }).on('error', reject);
        });

        const testAmount = 6.50;
        const qty = (testAmount / parseFloat(price.price)).toFixed(3);

        console.log(`Price: $${price.price}`);
        console.log(`Test: BUY ${qty} BNB ($${testAmount.toFixed(2)})\n`);

        // Try method 1: Without positionSide
        console.log('Method 1: Without positionSide...');
        try {
            const result = await signedRequest('POST', '/order', {
                symbol: 'BNBUSDT',
                side: 'BUY',
                type: 'MARKET',
                quantity: qty
            });
            console.log('✅ SUCCESS! Order executed.');
            console.log(`\nUser is RIGHT! Minimum IS $6.50\n`);
            process.exit(0);
        } catch (err1) {
            console.log(`❌ Failed: ${err1.message}\n`);
        }

        // Try method 2: With positionSide=BOTH
        console.log('Method 2: With positionSide=BOTH...');
        try {
            const result = await signedRequest('POST', '/order', {
                symbol: 'BNBUSDT',
                side: 'BUY',
                type: 'MARKET',
                quantity: qty,
                positionSide: 'BOTH'
            });
            console.log('✅ SUCCESS! Order executed.');
            console.log(`\nUser is RIGHT! Minimum IS $6.50\n`);
            process.exit(0);
        } catch (err2) {
            console.log(`❌ Failed: ${err2.message}\n`);
        }

        // Try method 3: With positionSide=LONG
        console.log('Method 3: With positionSide=LONG...');
        try {
            const result = await signedRequest('POST', '/order', {
                symbol: 'BNBUSDT',
                side: 'BUY',
                type: 'MARKET',
                quantity: qty,
                positionSide: 'LONG'
            });
            console.log('✅ SUCCESS! Order executed.');
            console.log(`\nUser is RIGHT! Minimum IS $6.50\n`);
            process.exit(0);
        } catch (err3) {
            console.log(`❌ Failed: ${err3.message}\n`);
        }

        console.log('All methods failed.');
        console.log('If errors are about NOTIONAL, minimum is higher than $6.50');
        console.log('If errors are about positionSide, need to fix parameters');

    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

testOrder();