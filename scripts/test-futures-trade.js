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

async function quickFuturesTest() {
    console.log('⚡ FUTURES BUY-SELL TEST');
    console.log('========================\n');

    try {
        // Small test trade - 0.00005 BTC Long (~$3.35 at $67,000)
        const btcQty = 0.00005;
        const leverage = 1; // 1x leverage (no leverage, just futures market)

        console.log(`📊 Setting 1x leverage on BTCUSDT...`);

        // Set leverage
        await signedRequest('fapi.binance.com', 'POST', '/fapi/v1/leverage', {
            symbol: 'BTCUSDT',
            leverage: leverage
        });

        console.log(`✅ Leverage set to 1x\n`);

        console.log(`🟢 OPEN LONG: ${btcQty} BTCUSDT...`);

        // Open Long position
        const openOrder = await signedRequest('fapi.binance.com', 'POST', '/fapi/v2/order', {
            symbol: 'BTCUSDT',
            side: 'BUY',
            type: 'MARKET',
            quantity: btcQty.toFixed(6)
        });

        const executedQty = parseFloat(openOrder.executedQty);
        const avgPrice = parseFloat(openOrder.cummulativeQuoteQty) / executedQty;

        console.log(`✅ OPENED LONG: ${executedQty.toFixed(6)} BTC @ $${avgPrice.toFixed(2)}`);
        console.log(`   Order ID: ${openOrder.orderId}\n`);

        // Wait 5 seconds then close
        await new Promise(r => setTimeout(r, 5000));

        console.log(`🔴 CLOSE LONG: ${executedQty.toFixed(6)} BTCUSDT...`);

        // Close position
        const closeOrder = await signedRequest('fapi.binance.com', 'POST', '/fapi/v2/order', {
            symbol: 'BTCUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: executedQty.toFixed(6)
        });

        const closePrice = parseFloat(closeOrder.origQty) !== 0 ?
            parseFloat(closeOrder.cummulativeQuoteQty) / parseFloat(closeOrder.executedQty) : avgPrice;
        const profit = parseFloat(closeOrder.cummulativeQuoteQty) - parseFloat(openOrder.cummulativeQuoteQty);
        const profitPercent = (profit / parseFloat(openOrder.cummulativeQuoteQty)) * 100;

        console.log(`✅ CLOSED: ${parseFloat(closeOrder.executedQty).toFixed(6)} BTC @ $${closePrice.toFixed(2)}`);
        console.log(`   Order ID: ${closeOrder.orderId}\n`);

        console.log('📊 TRADE SUMMARY:');
        console.log(`   Open:  $${parseFloat(openOrder.cummulativeQuoteQty).toFixed(2)}`);
        console.log(`   Close: $${parseFloat(closeOrder.cummulativeQuoteQty).toFixed(2)}`);
        console.log(`   P/L:   $${profit.toFixed(4)} (${profitPercent.toFixed(2)}%)\n`);

        console.log('✅ TEST COMPLETE - futures trading working!');

        return { open: openOrder, close: closeOrder, profit };

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

quickFuturesTest()
    .then(result => {
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });