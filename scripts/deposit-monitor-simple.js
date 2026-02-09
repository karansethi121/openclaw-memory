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

console.log('\n💰 DEPOSIT MONITOR (2-minute intervals)');
console.log('═══════════════════════════════════════════\n');

async function checkDeposit() {
    try {
        const account = await makeRequest('/account');
        const usdt = account.balances.find(b => b.asset === 'USDT');
        const freeUSDT = parseFloat(usdt.free);

        const now = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

        console.log(`[${now}] Checking balance...`);
        console.log(`💵 USDT: $${freeUSDT.toFixed(2)}`);

        if (freeUSDT >= 5.00) {
            console.log('\n✅✅✅ DEPOSIT ARRIVED! ✅✅✅');
            console.log(`Starting trading with $${freeUSDT.toFixed(2)}\n`);
            process.exit(0);
        } else {
            console.log('⏳ Still waiting...\n');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    setTimeout(checkDeposit, 120000); // Check every 2 minutes
}

checkDeposit();