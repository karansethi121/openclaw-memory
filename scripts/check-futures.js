const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

function getSignature(queryString) {
    return crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
}

async function makeRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = getSignature(queryString);
        const url = `https://fapi.binance.com/fapi/v2${endpoint}?${queryString}&signature=${signature}`;

        https.get(url, { headers: { 'X-MBX-APIKEY': API_KEY } }, (res) => {
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
        }).on('error', reject);
    });
}

async function checkFutures() {
    try {
        console.log('\n============================================================');
        console.log('🔍 FUTURES POSITION CHECK');
        console.log('============================================================\n');

        const account = await makeRequest('/account');

        console.log('📊 Futures Account Summary:\n');
        console.log(`  Total Balance:      $${parseFloat(account.totalWalletBalance).toFixed(2)}`);
        console.log(`  Available Balance:  $${parseFloat(account.availableBalance).toFixed(2)}`);
        console.log(`  Unrealized PNL:     $${parseFloat(account.totalUnrealizedProfit).toFixed(2)}\n`);

        console.log('═════════════════════════════════════════════════════');
        console.log('💼 OPEN POSITIONS');
        console.log('═════════════════════════════════════════════════════\n');

        let hasPositions = false;
        for (const pos of account.positions) {
            if (pos && pos.positionAmt) {
                const amt = parseFloat(pos.positionAmt);
                if (Math.abs(amt) > 0.000001) {
                    hasPositions = true;
                    const pnl = parseFloat(pos.unRealizedProfit);
                    const entry = pos.entryPrice || '0';
                    const mark = pos.markPrice || '0';
                    const liq = pos.liquidationPrice || '0';
                    const lev = pos.leverage || '1';
                    const side = amt > 0 ? 'LONG' : 'SHORT';

                    console.log(`  Symbol:    ${pos.symbol}`);
                    console.log(`  Side:      ${side} (${amt.toFixed(4)})`);
                    console.log(`  Leverage:  ${lev}x`);
                    console.log(`  Entry:     $${entry}`);
                    console.log(`  Mark:      $${mark}`);
                    console.log(`  Liquidation: $${liq}`);
                    console.log(`  PNL:       $${pnl.toFixed(2)}\n`);
                }
            }
        }

        if (!hasPositions) {
            console.log('  No open positions found.\n');
        }

        console.log('═════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        process.exit(1);
    }
}

checkFutures();