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

async function quickBuySellTest() {
    console.log('💰 QUICK BUY-SELL TEST');
    console.log('======================\n');

    try {
        // Buy small amount of ETH (minimum notional check)
        const amount = 5.00; // Minimum for ETH (~$5)
        console.log(`🟢 BUY Order: $${amount} ETH...`);

        const buyOrder = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
            symbol: 'ETHUSDT',
            side: 'BUY',
            type: 'MARKET',
            quoteOrderQty: amount.toFixed(2)
        });

        const ethQty = parseFloat(buyOrder.cummulativeQuoteQty) / parseFloat(buyOrder.cummulativeQuoteQty) * parseFloat(buyOrder.executedQty);
        const ethReceived = parseFloat(buyOrder.executedQty);
        const avgPrice = parseFloat(buyOrder.cummulativeQuoteQty) / ethReceived;

        console.log(`✅ BOUGHT: {ethReceived.toFixed(5)} ETH @ $${avgPrice.toFixed(2)}`);
        console.log(`   Order ID: ${buyOrder.orderId}\n`);

        // Wait 3 seconds then sell
        await new Promise(r => setTimeout(r, 3000));

        console.log(`🔴 SELL Order: ${ethReceived.toFixed(5)} ETH...`);

        const sellOrder = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
            symbol: 'ETHUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: ethReceived.toFixed(4)
        });

        const sellPrice = parseFloat(sellOrder.cummulativeQuoteQty) / parseFloat(sellOrder.executedQty);
        const profit = parseFloat(sellOrder.cummulativeQuoteQty) - parseFloat(buyOrder.cummulativeQuoteQty);
        const profitPercent = (profit / parseFloat(buyOrder.cummulativeQuoteQty)) * 100;

        console.log(`✅ SOLD: ${parseFloat(sellOrder.executedQty).toFixed(5)} ETH @ $${sellPrice.toFixed(2)}`);
        console.log(`   Order ID: ${sellOrder.orderId}\n`);

        console.log('📊 TRADE SUMMARY:');
        console.log(`   Buy:  $${parseFloat(buyOrder.cummulativeQuoteQty).toFixed(2)}`);
        console.log(`   Sell: $${parseFloat(sellOrder.cummulativeQuoteQty).toFixed(2)}`);
        console.log(`   P/L:  $${profit.toFixed(4)} (${profitPercent.toFixed(2)}%)\n`);

        console.log('✅ TEST COMPLETE - buy and sell working!');

        return { buy: buyOrder, sell: sellOrder, profit };

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

quickBuySellTest()
    .then(result => {
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });