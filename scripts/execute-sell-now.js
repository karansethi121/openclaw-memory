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

async function executeSell() {
    console.log('🔴 EXECUTING SELL ORDER - LOCK PROFIT');
    console.log('=====================================\n');

    try {
        // Sell entire BTC position
        const btcQty = 0.000220;

        console.log(`Selling ${btcQty} BTC...`);

        const sellOrder = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
            symbol: 'BTCUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: btcQty.toFixed(6)
        });

        const avgPrice = parseFloat(sellOrder.cummulativeQuoteQty) / parseFloat(sellOrder.executedQty);
        const revenue = parseFloat(sellOrder.cummulativeQuoteQty);
        const cost = 14.70; // Approx cost from earlier buys
        const profit = revenue - cost;
        const profitPercent = (profit / cost) * 100;

        console.log('✅ SELL ORDER FILLED\n');
        console.log(`Order ID: ${sellOrder.orderId}`);
        console.log(`Sold: ${parseFloat(sellOrder.executedQty).toFixed(6)} BTC`);
        console.log(`Avg Price: $${avgPrice.toFixed(2)}`);
        console.log(`Revenue: $${revenue.toFixed(2)}\n`);

        console.log('💰 TRADE SUMMARY:');
        console.log(`   Cost: $${cost.toFixed(2)}`);
        console.log(`   Revenue: $${revenue.toFixed(2)}`);
        console.log(`   Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)\n`);

        return { order: sellOrder, profit, revenue, profitPercent };

    } catch (error) {
        console.error('❌ Sell failed:', error.message);
        throw error;
    }
}

executeSell()
    .then(result => {
        console.log('✅ PROFIT LOCKED IN!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Execution failed:', err.message);
        process.exit(1);
    });