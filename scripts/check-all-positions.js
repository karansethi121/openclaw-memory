const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function signedRequest(hostname, method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: hostname,
            path: `/${endpoint}?${queryString}&signature=${signature}`,
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

async function checkAllPositions() {
    console.log('\n============================================================');
    console.log('🔍 CHECKING ALL POSITIONS');
    console.log('============================================================\n');

    // Check Futures
    console.log('📊 FUTURES POSITIONS:\n');
    try {
        const futuresAccount = await signedRequest('fapi.binance.com', 'GET', '/fapi/v2/account');

        let hasFuturePositions = false;
        for (const pos of futuresAccount.positions) {
            const amount = Math.abs(parseFloat(pos.positionAmt));
            if (amount > 0.0001) {
                hasFuturePositions = true;
                const side = parseFloat(pos.positionAmt) > 0 ? 'LONG' : 'SHORT';
                const pnl = parseFloat(pos.unRealizedProfit);
                const pnlPercent = parseFloat(pos.percentage);

                console.log(`${pos.symbol}:`);
                console.log(`   Side: ${side}`);
                console.log(`   Quantity: ${pos.positionAmt}`);
                console.log(`   Entry: $${parseFloat(pos.entryPrice).toFixed(2)}`);
                console.log(`   Leverage: ${pos.leverage}x`);
                console.log(`   PNL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)\n`);
            }
        }

        if (!hasFuturePositions) {
            console.log('   ✅ No futures positions open\n');
        }
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
    }

    // Check Spot
    console.log('📊 SPOT POSITIONS (Coins held):\n');
    try {
        const spotAccount = await signedRequest('api.binance.com', 'GET', '/account');

        let hasSpotPositions = false;
        for (const balance of spotAccount.balances) {
            const free = parseFloat(balance.free);
            const locked = parseFloat(balance.locked);
            const total = free + locked;

            if (total > 0 && balance.asset !== 'USDT') {
                hasSpotPositions = true;
                console.log(`${balance.asset}:`);
                console.log(`   Free: ${free.toFixed(6)}`);
                console.log(`   Locked: ${locked.toFixed(6)}`);
                console.log(`   Total: ${total.toFixed(6)}\n`);
            }
        }

        if (!hasSpotPositions) {
            console.log('   ✅ No spot positions (non-USDT coins)\n');
        }

        // USDT balance
        const usdt = spotAccount.balances.find(b => b.asset === 'USDT');
        if (usdt) {
            const totalUsdt = parseFloat(usdt.free) + parseFloat(usdt.locked);
            console.log(`💰 USDT Balance: $${totalUsdt.toFixed(2)}\n`);
        }
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
    }
}

checkAllPositions();