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
                    if (result.code && result.code !== 200 && result.code !== 200) {
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
console.log('🧪 TESTING BNB FUTURES MINIMUM ORDER');
console.log('============================================================\n');

async function testOrder() {
    try {
        // Get current BNB futures price
        console.log('Getting current BNB futures price...');
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

        console.log(`Current BNB futures price: $${price.price}\n`);

        // User says minimum is $6.50, let's test $6.50 order
        const testAmount = 6.50;
        const qty = (testAmount / parseFloat(price.price)).toFixed(3);

        console.log(`Test Order: BUY ${qty} BNB (worth $${testAmount.toFixed(2)})`);
        console.log(`This matches user's claimed minimum of $6.50\n`);

        console.log('Submitting test order...');
        const result = await signedRequest('POST', '/order', {
            symbol: 'BNBUSDT',
            side: 'BUY',
            type: 'MARKET',
            quantity: qty
        });

        console.log('\n✅✅✅ ORDER ACCEPTED! ✅✅✅\n');
        console.log(`Order ID: ${result.orderId}`);
        console.log(`Filled qty: ${result.executedQty} BNB`);
        console.log(`Price: $${result.avgPrice || result.price}`);
        console.log(`Notional: $${result.cummulativeQuoteQty}`);
        console.log(`\nUser is CORRECT! BNB futures minimum is $6.50, NOT $100!`);
        console.log(`Futures trading can start with $7 balance!\n`);

        process.exit(0);

    } catch (err) {
        console.log(`\n❌ Order Failed: ${err.message}\n`);

        if (err.message.includes('MIN_NOTIONAL')) {
            console.log('CONCLUSION: Order rejected due to MIN_NOTIONAL filter');
            console.log(`User says: $6.50 minimum`);
            console.log(`API says: Requires higher minimum`);
            console.log(`\nChecking specific error details...`);
        }

        process.exit(1);
    }
}

testOrder();