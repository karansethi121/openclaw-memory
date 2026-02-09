const https = require('https');

async function getSpotAccount() {
    return new Promise((resolve, reject) => {
        const crypto = require('crypto');
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
        const API_KEY = config.env?.BINANCE_API_KEY || '';
        const API_SECRET = config.env?.BINANCE_API_SECRET || '';

        const timestamp = Date.now();
        const queryString = new URLSearchParams({ timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'api.binance.com',
            path: `/api/v3/account?${queryString}&signature=${signature}`,
            method: 'GET',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
                    resolve({ error: 'HTML response', data: data.substring(0, 100) });
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(err);
                    }
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('\n============================================================');
    console.log('🔍 SPOT POSITIONS CHECK');
    console.log('============================================================\n');

    const account = await getSpotAccount();

    if (account.error) {
        console.log(`❌ API Error: ${account.error}`);
        console.log(`Response: ${account.data}...\n`);
        console.log('⏳ API returning HTML - try again in 2 minutes');
        return;
    }

    console.log('📊 SPOT HOLDINGS:\n');

    let holdings = [];
    for (const balance of account.balances) {
        const free = parseFloat(balance.free);
        const locked = parseFloat(balance.locked);
        const total = free + locked;

        if (total > 0) {
            holdings.push({
                asset: balance.asset,
                free: free,
                locked: locked,
                total: total
            });
        }
    }

    // Sort by total value (excluding USDT which is base)
    holdings.sort((a, b) => b.total - a.total);

    for (const h of holdings) {
        console.log(`${h.asset}:`);
        console.log(`   Free: ${h.free.toFixed(6)}`);
        console.log(`   Locked: ${h.locked.toFixed(6)}`);
        console.log(`   Total: ${h.total.toFixed(6)}`);
        console.log();
    }

    // Show USDT separately
    const usdt = holdings.find(h => h.asset === 'USDT');
    if (usdt) {
        console.log(`💰 Available USDT: $${usdt.free.toFixed(2)}`);
        console.log(`\n⚠️ Only ${usdt.free.toFixed(2)} USDT available for trading`);
    }
}

main();