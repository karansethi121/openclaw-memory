const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

function getSignature(queryString) {
    return crypto.createHmac('sha256', API_KEY).update(queryString).digest('hex');
}

async function makeRequest(path, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
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

const MINIMUM_BALANCE = 5.00;
const CHECK_INTERVAL = 60000; // 1 minute

console.log('\n============================================================');
console.log('💰 DEPOSIT MONITOR');
console.log('============================================================\n');
console.log(`Waiting for deposit...`);
console.log(`Current minimum required: $${MINIMUM_BALANCE.toFixed(2)}\n`);

let balance = 0;
let startTime = Date.now();

async function checkBalance() {
    try {
        const account = await makeRequest('/account');
        const usdt = account.balances.find(b => b.asset === 'USDT');
        balance = parseFloat(usdt.free);

        const elapsed = Math.floor((Date.now() - startTime) / 60000);
        const timeStr = `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;

        if (balance < MINIMUM_BALANCE) {
            console.log(`[${timeStr}] USDT Balance: $${balance.toFixed(2)} - Waiting for >= $${MINIMUM_BALANCE.toFixed(2)}...`);
        } else {
            console.log(`\n✅ DEPOSIT DETECTED!`);
            console.log(`\nCurrent Balance: $${balance.toFixed(2)}`);
            console.log(`Minimum Required: $${MINIMUM_BALANCE.toFixed(2)}`);
            console.log(`Ready to Trade: YES ✅\n`);

            console.log('Would you like me to restart trading bots?');
            console.log('Reply to confirm or cancel.\n');

            process.exit(0);
        }
    } catch (err) {
        console.error(`Error checking balance: ${err.message}`);
    }
}

// Check immediately and then on interval
checkBalance();
setInterval(checkBalance, CHECK_INTERVAL);

console.log('\nMonitoring started. Will check every minute...\n');