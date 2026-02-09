const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function makeRequest(path, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');
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

async function checkBalance() {
    try {
        const account = await makeRequest('/account');

        console.log('\n═════════════════════════════════════════════════════');
        console.log('💰 SPOT BALANCE CHECK');
        console.log('═════════════════════════════════════════════════════\n');

        let totalUSDT = 0;

        for (const bal of account.balances) {
            const free = parseFloat(bal.free);
            const locked = parseFloat(bal.locked);
            if (free > 0 || locked > 0) {
                const asset = bal.asset;
                let value = 0;

                // Get price for non-USDT assets
                if (asset !== 'USDT') {
                    try {
                        const priceData = await new Promise((res, rej) => {
                            https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDT`, (r) => {
                                let d = '';
                                r.on('data', c => d += c);
                                r.on('end', () => { try { res(JSON.parse(d)); } catch { rej(); } });
                                r.on('error', rej);
                            });
                        });
                        const price = parseFloat(priceData.price);
                        value = price * free;
                        totalUSDT += value;
                    } catch (err) { value = 0; }
                } else {
                    totalUSDT += free;
                }

                const icon = asset === 'USDT' ? '💵' : '🪙';
                console.log(`${icon} ${asset.padEnd(8)} | Free: ${free.toFixed(4).padEnd(12)} | Locked: ${locked.toFixed(4).padEnd(10)} | Value: $${value.toFixed(2)}`);
            }
        }

        console.log('\n' + '─'.repeat(60));
        console.log(`📊 Total Portfolio Value: $${totalUSDT.toFixed(2)}`);
        console.log(`💵 Available USDT for Trading: $${totalUSDT.toFixed(2)}`);
        console.log('─'.repeat(60) + '\n');

        if (totalUSDT >= 5.00) {
            console.log('✅ SUFFICIENT BALANCE - Trading can resume!');
            console.log(`   Minimum required: $5.00`);
            console.log(`   Available: $${totalUSDT.toFixed(2)}`);
            console.log(`   Surplus: $${(totalUSDT - 5).toFixed(2)}\n`);
        } else {
            console.log('❌ INSUFFICIENT BALANCE - Still waiting...');
            console.log(`   Minimum required: $5.00`);
            console.log(`   Available: $${totalUSDT.toFixed(2)}`);
            console.log(`   Shortfall: $${(5 - totalUSDT).toFixed(2)}\n`);
        }
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
        process.exit(1);
    }
}

checkBalance();