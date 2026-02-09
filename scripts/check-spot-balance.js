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

console.log('Checking Binance Spot Account Balance...\n');

makeRequest('/account').then(account => {
    const usdt = account.balances.find(b => b.asset === 'USDT');
    console.log(`USDT Free Balance: $${parseFloat(usdt.free).toFixed(2)}`);
    console.log(`USDT Locked: $${parseFloat(usdt.locked).toFixed(2)}`);
    process.exit(0);
}).catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});