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

async function main() {
    try {
        const account = await makeRequest('/account');

        // Find USDT balance
        const usdt = account.balances.find(b => b.asset === 'USDT');
        const freeUSDT = parseFloat(usdt.free);

        console.log('\n💵 USDT Balance:', freeUSDT.toFixed(2));
        console.log('📊 Minimum required: $5.00');

        if (freeUSDT >= 5.00) {
            console.log('\n✅ DEPOSIT ARRIVED! Trading can resume!\n');
        } else {
            console.log('\n⏳ Still waiting for deposit...');
            console.log('   Shortfall:', (5 - freeUSDT).toFixed(2), 'USDT\n');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();