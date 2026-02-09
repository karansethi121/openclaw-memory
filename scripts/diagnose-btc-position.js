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

async function testSell() {
    console.log('🔍 DIAGNOSTIC: Checking BTC Position Details\n');

    try {
        // Get detailed account info
        const account = await signedRequest('api.binance.com', 'GET', '/api/v3/account');
        const btcBal = account.balances.find(b => b.asset === 'BTC');

        console.log('BTC Balance Details:');
        console.log(`   Total: ${btcBal.free} + ${btcBal.locked}`);
        console.log(`   Available: ${btcBal.free}`);
        console.log(`   Lock/Total Ratio: ${(parseFloat(btcBal.locked) / parseFloat(btcBal.free) * 100).toFixed(2)}%\n`);

        // Current price
        const price = await new Promise((resolve, reject) => {
            https.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try { resolve(parseFloat(JSON.parse(data).price)); }
                    catch (err) { reject(err); }
                });
            }).on('error', reject);
        });

        const value = parseFloat(btcBal.free) * price;
        console.log(`   Value @ $${price.toLocaleString()}: $${value.toFixed(2)}\n`);

        // Try sell with different precision
        console.log('🔴 Testing sell with precise amount\n');
        const sellQty = parseFloat(btcBal.free);

        console.log(`Attempting to sell: ${sellQty} BTC`);

        const sellOrder = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
            symbol: 'BTCUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: sellQty.toFixed(8)
        });

        const avgPrice = parseFloat(sellOrder.cummulativeQuoteQty) / parseFloat(sellOrder.executedQty);
        const revenue = parseFloat(sellOrder.cummulativeQuoteQty);
        const profit = revenue - 14.70;
        const profitPercent = (profit / 14.70) * 100;

        console.log('✅ SELL SUCCESSFUL!\n');
        console.log(`Order ID: ${sellOrder.orderId}`);
        console.log(`Sold: ${parseFloat(sellOrder.executedQty).toFixed(8)} BTC`);
        console.log(`Avg Price: $${avgPrice.toFixed(2)}`);
        console.log(`Revenue: $${revenue.toFixed(2)}`);
        console.log(`Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)\n`);

        return { success: true, profit, revenue, profitPercent, order: sellOrder };

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nThis may mean:');
        console.error('   1. The earlier buy orders didn\'t actually execute');
        console.error('   2. Account balance is incorrect in display');
        console.error('   3. Binance is still processing previous orders');
        return { success: false, error: error.message };
    }
}

testSell()
    .then(result => {
        if (result.success) {
            console.log('✅ TRADE COMPLETE');
        } else {
            console.log('⚠️  DIAGNOSTIC COMPLETE - Issue identified');
        }
        process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });