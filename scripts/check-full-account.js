const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

function getSignature(queryString) {
    return crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
}

async function makeRequest(path, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = Object.entries({ ...params, timestamp }).map(([k, v]) => `${k}=${v}`).join('&');
        const signature = getSignature(queryString);
        const url = `https://api.binance.com/api/v3${path}?${queryString}&signature=${signature}`;

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

async function getPrice(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

console.log('Checking Full Account Holdings...\n');

makeRequest('/account').then(async account => {
    console.log('═════════════════════════════════════════════════════');
    console.log('💰 BINANCE SPOT ACCOUNT BALANCES');
    console.log('═════════════════════════════════════════════════════\n');

    let totalValue = 0;
    const assets = [];

    for (const balance of account.balances) {
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        const total = free + locked;

        if (total > 0) {
            let value = 0;
            let price = 1;

            if (balance.asset === 'USDT') {
                value = total;
            } else {
                try {
                    const priceData = await getPrice(balance.asset + 'USDT');
                    price = parseFloat(priceData.price);
                    value = total * price;
                } catch (err) {
                    // Can't get price for this asset
                }
            }

            if (value > 0.01 || balance.asset === 'USDT') {
                assets.push({
                    asset: balance.asset,
                    free,
                    locked,
                    total,
                    price,
                    value
                });
                totalValue += value;
            }
        }
    }

    // Sort by value
    assets.sort((a, b) => b.value - a.value);

    // Print assets
    console.log('Asset   | Free         | Locked       | Total        | Price (USDT) | Value (USDT)  ');
    console.log('─────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────────────\n');

    for (const asset of assets) {
        const freeStr = asset.free.toFixed(6).padEnd(12);
        const lockedStr = asset.locked.toFixed(6).padEnd(12);
        const totalStr = asset.total.toFixed(6).padEnd(12);
        const priceStr = asset.price < 1 ? asset.price.toFixed(6).padEnd(12) : asset.price.toFixed(2).padEnd(12);
        const valueStr = '$' + asset.value.toFixed(2).padEnd(13);
        console.log(`${asset.asset.padEnd(8)} | ${freeStr} | ${lockedStr} | ${totalStr} | ${priceStr} | ${valueStr}`);
    }

    console.log('─────────┴──────────────┴──────────────┴──────────────┴──────────────┴────────────────');
    console.log(`\nTOTAL PORTFOLIO VALUE: $${totalValue.toFixed(2)}\n`);

    // USDT specific
    console.log('═════════════════════════════════════════════════════');
    console.log('💵 USDT SPECIFIC');
    console.log('═════════════════════════════════════════════════════\n');

    const usdt = account.balances.find(b => b.asset === 'USDT');
    console.log(`Free for trading:  $${parseFloat(usdt.free).toFixed(2)}`);
    console.log(`Locked in orders:   $${parseFloat(usdt.locked).toFixed(2)}`);
    console.log(`Total USDT:        $${(parseFloat(usdt.free) + parseFloat(usdt.locked)).toFixed(2)}\n`);

    process.exit(0);
}).catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});