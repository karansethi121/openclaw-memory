const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

// HTML Response Detection Function
function isHtmlResponse(data) {
    if (!data || typeof data !== 'string') return false;
    const trimmed = data.trim().toLowerCase();
    return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

async function signedRequest(hostname, method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: hostname,
            path: `${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Check for HTML response (API error)
                if (isHtmlResponse(data)) {
                    console.log('❌ API returned HTML instead of JSON');
                    console.log('   → Likely: rate limiting, maintenance, or auth error');
                    console.log('   → Cannot proceed - will retry next automation cycle');
                    reject(new Error('HTML response from API'));
                    return;
                }

                try {
                    const result = JSON.parse(data);
                    if (result.code && result.code !== 200) {
                        reject(new Error(`${result.code}: ${result.msg}`));
                    } else {
                        resolve(result);
                    }
                } catch (err) { reject(err); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

console.log('\n============================================================');
console.log('🔄 AUTONOMOUS FUND CONSOLIDATION');
console.log('============================================================');
console.log('Improved: Added HTML response detection');
console.log('============================================================\n');

async function consolidateFunds() {
    try {
        console.log('Step 1: Getting account balances...');
        const account = await signedRequest('api.binance.com', 'GET', '/account');

        console.log('\n📊 Non-USDT Holdings:');
        let totalUSDT = 0;

        for (const balance of account.balances) {
            const free = parseFloat(balance.free);
            const asset = balance.asset;

            if (free > 0 && asset !== 'USDT') {
                const symbol = `${asset}USDT`;
                console.log(`   ${asset}: ${free.toFixed(6)} (${symbol})`);

                try {
                    console.log(`   🔄 Selling ${asset}...`);

                    const result = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
                        symbol: symbol,
                        side: 'SELL',
                        type: 'MARKET',
                        quantity: free.toFixed(8)
                    });

                    const usdtReceived = parseFloat(result.cummulativeQuoteQty);
                    totalUSDT += usdtReceived;
                    console.log(`   ✅ Sold: +$${usdtReceived.toFixed(2)} USDT\n`);

                } catch (err) {
                    console.log(`   ❌ Sell failed: ${err.message}\n`);
                }
            }
        }

        console.log('Step 2: Checking final USDT balance...');
        await new Promise(r => setTimeout(r, 1000));
        const newAccount = await signedRequest('api.binance.com', 'GET', '/account');
        const usdtBalance = parseFloat(newAccount.balances.find(b => b.asset === 'USDT').free);

        console.log(`\n💰 Final USDT Balance: $${usdtBalance.toFixed(2)}`);
        console.log(`\n🎯 Consolidated to enable trading!`);

        if (usdtBalance >= 5) {
            console.log('✅ Can now trade ($5 minimum met)');
        } else {
            console.log('⚠️ Still below $5 minimum');
        }

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        if (err.message.includes('HTML')) {
            console.log('💡 Tip: Check if API is rate-limited or under maintenance');
        }
    }
}

consolidateFunds();