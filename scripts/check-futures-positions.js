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

async function getPublicRequest(endpoint) {
    return new Promise((resolve, reject) => {
        https.get(`https://fapi.binance.com/fapi/v1${endpoint}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

console.log('\n============================================================');
console.log('🔍 FUTURES POSITION CHECK');
console.log('============================================================\n');

async function checkFutures() {
    try {
        // Get account/positions
        console.log('📊 Checking Futures Account...\n');
        const account = await makeRequest('/account');

        console.log(`Total Balance: $${parseFloat(account.totalWalletBalance).toFixed(2)}`);
        console.log(`Available Balance: $${parseFloat(account.availableBalance).toFixed(2)}`);
        console.log(`Total Unrealized PNL: $${parseFloat(account.totalUnrealizedProfit).toFixed(2)}\n`);

        console.log('═════════════════════════════════════════════════════');
        console.log('💼 OPEN POSITIONS');
        console.log('═════════════════════════════════════════════════════\n');

        // Get current prices for position symbols
        const positionSymbols = account.positions.filter(p => parseFloat(p.positionAmt) !== 0).map(p => p.symbol);

        if (positionSymbols.length === 0) {
            console.log('No open positions.\n');
        } else {
            console.log('Symbol      | Position    | Entry Price | Mark Price | PNL      | Liquidation');
            console.log('─────────────┼─────────────┼─────────────┼─────────────┼──────────┼────────────\n');

            for (const pos of account.positions) {
                const amt = parseFloat(pos.positionAmt);
                if (Math.abs(amt) > 0) {
                    const pnl = parseFloat(pos.unRealizedProfit);
                    console.log(`${pos.symbol.padEnd(12)} | ${amt.toFixed(4).padEnd(11)} | ${pos.entryPrice.padEnd(11)} | ${pos.markPrice.padEnd(11)} | $${pnl.toFixed(2).padEnd(8)} | ${pos.liquidationPrice}`);
                }
            }
            console.log('\n');
        }

        console.log('═════════════════════════════════════════════════════');

        process.exit(0);
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        process.exit(1);
    }
}

checkFutures();