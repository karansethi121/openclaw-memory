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

async function closeAllPositions() {
    try {
        console.log('\n🔍 Checking open positions...\n');

        const account = await signedRequest('GET', '/account');

        for (const pos of account.positions) {
            const qty = parseFloat(pos.positionAmt);

            if (Math.abs(qty) > 0) {
                const side = qty > 0 ? 'SELL' : 'BUY';
                const absQty = Math.abs(qty).toFixed(3);

                console.log(`Found position: ${pos.symbol} ${absQty}`);
                console.log(`Entry: $${pos.entryPrice} | Leverage: ${pos.leverage}x`);
                console.log(`\n🔴 CLOSING ${absQty} ${pos.symbol} (${pos.leverage}x)\n`);

                try {
                    const result = await signedRequest('POST', '/order', {
                        symbol: pos.symbol,
                        side: side,
                        type: 'MARKET',
                        quantity: absQty,
                        positionSide: pos.positionSide || 'BOTH',
                        reduceOnly: true
                    });

                    const orderQty = parseFloat(result.executedQty);
                    const orderAvg = parseFloat(result.avgPrice) || parseFloat(result.cummulativeQuoteQty) / orderQty;
                    const pnl = parseFloat(result.realizedPnl) || 0;

                    console.log(`✅ CLOSED!`);
                    console.log(`   Qty: ${orderQty} @ $${orderAvg.toFixed(2)}`);
                    console.log(`   PNL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}`);

                } catch (err) {
                    // Try without positionSide
                    console.log(`   Retrying without positionSide...`);
                    try {
                        const result = await signedRequest('POST', '/order', {
                            symbol: pos.symbol,
                            side: side,
                            type: 'MARKET',
                            quantity: absQty,
                            reduceOnly: true
                        });

                        const orderQty = parseFloat(result.executedQty);
                        const orderAvg = parseFloat(result.avgPrice) || parseFloat(result.cummulativeQuoteQty) / orderQty;
                        const pnl = parseFloat(result.realizedPnl) || 0;

                        console.log(`✅ CLOSED!`);
                        console.log(`   Qty: ${orderQty} @ $${orderAvg.toFixed(2)}`);
                        console.log(`   PNL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}`);
                    } catch (err2) {
                        console.log(`❌ Failed: ${err2.message}`);
                    }
                }
            }
        }

        console.log('\n📊 Checking final balance...\n');
        await new Promise(r => setTimeout(r, 1000));
        const finalAccount = await signedRequest('GET', '/account');
        const available = parseFloat(finalAccount.availableBalance);

        console.log(`💰 Available Balance: $${available.toFixed(2)}`);
        console.log('\nAll positions closed!\n');

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
    }
}

closeAllPositions();