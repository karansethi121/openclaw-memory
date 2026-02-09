const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function closePosition(symbol, qty) {
    console.log(`🔄 Closing ${symbol} position (${qty})...`);

    const timestamp = Date.now();
    const queryString = new URLSearchParams({
        symbol: symbol,
        positionSide: 'LONG',
        side: 'SELL',
        type: 'MARKET',
        quantity: parseFloat(qty).toFixed(3),
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
                if (data.startsWith('<!DOCTYPE')) {
                    reject(new Error('HTML response'));
                } else {
                    try {
                        const result = JSON.parse(data);
                        if (result.code && result.code !== 200) {
                            reject(new Error(`${result.code}: ${result.msg}`));
                        } else {
                            resolve(result);
                        }
                    } catch (err) { reject(err); }
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('\n============================================================');
    console.log('🔴 CLOSING BNB FUTURES POSITION');
    console.log('============================================================\n');

    try {
        // Get position info from positionRisk (shows real data)
        const riskData = await require('./check-bnb-position-risk').getPositionRisk('BNBUSDT');

        let foundPosition = null;
        for (const pos of riskData) {
            const qty = parseFloat(pos.positionAmt);
            if (qty !== 0) {
                foundPosition = pos;
                console.log('Found Position:');
                console.log(`   Size: ${qty} BNB`);
                console.log(`   Entry: $${parseFloat(pos.entryPrice).toFixed(2)}`);
                console.log(`   Current: $${parseFloat(pos.markPrice).toFixed(2)}`);
                console.log(`   PNL: $${parseFloat(pos.unRealizedProfit).toFixed(2)}`);
                console.log();

                const result = await closePosition(pos.symbol, qty);
                const pnl = parseFloat(result.realizedPnl || 0);

                console.log(`✅ Position Closed!`);
                console.log(`   Qty: ${result.executedQty}`);
                console.log(`   Avg Price: $${result.avgPrice}`);
                console.log(`   Realized PNL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}\n`);
                break;
            }
        }

        console.log('Step 2: Verifying...\n');
        await new Promise(r => setTimeout(r, 2000));

        const newRiskData = await require('./check-bnb-position-risk').getPositionRisk('BNBUSDT');
        let stillOpen = 0;

        for (const pos of newRiskData) {
            if (parseFloat(pos.positionAmt) !== 0) stillOpen++;
        }

        if (stillOpen === 0) {
            console.log('✅ Position closed successfully! 🎉\n');
        } else {
            console.log(`⚠️ Position still open (count: ${stillOpen})\n`);
        }

        console.log('≡'.repeat(60));

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
    }
}

main();