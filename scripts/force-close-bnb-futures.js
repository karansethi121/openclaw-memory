const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function closeFuturesPosition(symbol) {
    console.log(`\n🔴 CLOSING FUTURES POSITION: ${symbol}\n`);

    const timestamp = Date.now();

    const queryString = new URLSearchParams({
        symbol: symbol,
        positionSide: 'LONG',
        side: 'SELL',
        type: 'MARKET',
        quantity: '0.010',
        timestamp: timestamp.toString()
    }).toString();

    const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

    const options = {
        hostname: 'fapi.binance.com',
        path: `/fapi/v1/order?${queryString}&signature=${signature}`,
        method: 'POST',
        headers: { 'X-MBX-APIKEY': API_KEY }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);

                if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
                    console.log('HTML Response (rate limited)');
                    reject(new Error('HTML response'));
                } else {
                    try {
                        const result = JSON.parse(data);

                        if (result.code && result.code !== 200) {
                            console.log(`Error: ${result.code} - ${result.msg}`);
                            reject(new Error(`${result.code}: ${result.msg}`));
                        } else {
                            console.log(`\n✅ Position Closed!`);
                            console.log(`Symbol: ${result.symbol}`);
                            console.log(`Side: ${result.side}`);
                            console.log(`Quantity: ${result.executedQty}`);
                            console.log(`Price: $${result.avgPrice}`);
                            console.log(`Realized PNL: $${result.realizedPnl || 'N/A'}`);
                            resolve(result);
                        }
                    } catch (err) {
                        console.log(`Parse Error: ${err.message}`);
                        reject(err);
                    }
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

closeFuturesPosition('BNBUSDT')
    .then(() => console.log('\n✅ Success!\n'))
    .catch(err => console.error(`\n❌ Error: ${err.message}\n`));