const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function getPositionRisk(symbol) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ 
            symbol: symbol,
            timestamp: timestamp.toString()
        }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v2/positionRisk?${queryString}&signature=${signature}`,
            method: 'GET',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.startsWith('<!DOCTYPE')) {
                    reject(new Error('HTML response'));
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) { reject(err); }
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function reducePosition(symbol, qty) {
    console.log(`🔄 Reducing ${symbol} position by ${qty}...`);

    const timestamp = Date.now();
    const queryString = new URLSearchParams({
        symbol: symbol,
        positionSide: 'LONG',
        side: 'SELL',
        type: 'MARKET',
        quantity: qty.toFixed(3),
        reduceOnly: 'true',
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
    console.log('🔍 BNB FUTURES POSITION DETAILS');
    console.log('============================================================\n');

    try {
        const positions = await getPositionRisk('BNBUSDT');

        for (const pos of positions) {
            const qty = parseFloat(pos.positionAmt);
            if (qty !== 0) {
                console.log('Position Details:');
                console.log(`   Symbol: ${pos.symbol}`);
                console.log(`   Position Side: ${pos.positionSide}`);
                console.log(`   Position Amt: ${pos.positionAmt}`);
                console.log(`   Entry Price: $${parseFloat(pos.entryPrice).toFixed(2)}`);
                console.log(`   Mark Price: $${parseFloat(pos.markPrice).toFixed(2)}`);
                console.log(`   Unrealized PNL: $${parseFloat(pos.unRealizedProfit).toFixed(2)}`);
                console.log(`   Notional: $${parseFloat(pos.notional).toFixed(2)}\n`);

                console.log('Trying to close with reduceOnly flag...\n');

                try {
                    const result = await reducePosition(pos.symbol, Math.abs(qty));
                    console.log(`✅ Order Sent!`);
                    console.log(`   Order ID: ${result.orderId}`);
                    console.log(`   Executed Qty: ${result.executedQty}`);
                    console.log(`   Avg Price: $${result.avgPrice}`);
                    console.log(`   Realized PNL: $${result.realizedPnl || 'N/A'}\n`);
                } catch (err) {
                    console.log(`❌ Error: ${err.message}\n`);
                }
            }
        }

        console.log('Step 2: Checking result...\n');
        await new Promise(r => setTimeout(r, 2000));

        const newPositions = await getPositionRisk('BNBUSDT');
        let stillOpen = 0;

        for (const pos of newPositions) {
            if (parseFloat(pos.positionAmt) !== 0) stillOpen++;
        }

        if (stillOpen === 0) {
            console.log('✅ Position closed successfully!\n');
        } else {
            console.log(`⚠️ Position still open (data corruption issue persists)\n`);
        }

        console.log('≡'.repeat(60));

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
    }
}

main();