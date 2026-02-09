const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function getFuturesAccount() {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v2/account?${queryString}&signature=${signature}`,
            method: 'GET',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
                    reject(new Error('HTML response - rate limited'));
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

async function closePosition(symbol, positionSide, quantity) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ 
            symbol: symbol,
            positionSide: positionSide,
            side: 'SELL',
            type: 'MARKET',
            quantity: Math.abs(parseFloat(quantity)).toFixed(3),
            timestamp: timestamp.toString()
        }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v1/order?${queryString}&signature=${signature}`,
            method: 'POST',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
                    reject(new Error('HTML response - rate limited'));
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

async function closeAllFutures() {
    console.log('\n============================================================');
    console.log('🔴 CLOSING ALL FUTURES POSITIONS');
    console.log('============================================================\n');

    try {
        const account = await getFuturesAccount();

        console.log('📊 Finding open positions...\n');

        let closedCount = 0;
        let closedPnl = 0;

        for (const pos of account.positions) {
            const qty = parseFloat(pos.positionAmt);

            if (qty !== 0) {
                console.log(`${pos.symbol} (${pos.positionSide}): ${qty}`);

                try {
                    console.log(`   🔄 Closing...`);

                    const result = await closePosition(pos.symbol, pos.positionSide, qty);

                    const pnl = parseFloat(result.realizedPnl || 0);
                    closedPnl += pnl;
                    closedCount++;

                    const emoji = pnl > 0 ? '✅' : '❌';
                    console.log(`   ${emoji} Closed ${result.executedQty} @ $${result.avgPrice}`);
                    console.log(`   💰 Realized PNL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}\n`);

                } catch (err) {
                    console.log(`   ❌ Failed: ${err.message}\n`);
                }
            }
        }

        console.log('Step 2: Verifying closure...\n');
        await new Promise(r => setTimeout(r, 1000));

        const newAccount = await getFuturesAccount();

        let stillOpen = 0;
        for (const pos of newAccount.positions) {
            if (parseFloat(pos.positionAmt) !== 0) stillOpen++;
        }

        const totalBalance = parseFloat(newAccount.totalWalletBalance);
        const available = parseFloat(newAccount.availableBalance);

        console.log(`📊 Futures Account After Close:`);
        console.log(`   Total Balance: $${totalBalance.toFixed(2)}`);
        console.log(`   Available: $${available.toFixed(2)}`);
        console.log(`   Positions Open: ${stillOpen}`);
        console.log(`   Closed Count: ${closedCount}`);
        console.log(`   Total Realized PNL: ${closedPnl > 0 ? '+' : ''}$${closedPnl.toFixed(2)}\n`);

        if (stillOpen === 0) {
            console.log(`✅ All futures positions closed! 🎉\n`);
        } else {
            console.log(`⚠️ ${stillOpen} position(s) still open\n`);
        }

        console.log('≡'.repeat(60));

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
    }
}

closeAllFutures();