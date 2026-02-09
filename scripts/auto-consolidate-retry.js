// Enhanced auto consolidation with retry logic
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

async function signedRequest(hostname, method, endpoint, params = {}, retries = 3) {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await doRequest(hostname, method, endpoint, params);
        resolve(result);
        return;
      } catch (err) {
        if (attempt === retries) {
          reject(err);
          return;
        }
        // Wait before retry on rate limit
        if (err.message && err.message.includes('HTML')) {
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          console.log(`   ⏳ Rate limit detected, waiting ${waitTime/1000}s before retry ${attempt}/${retries}...`);
          await new Promise(r => setTimeout(r, waitTime));
        }
      }
    }
  });
}

function doRequest(hostname, method, endpoint, params = {}) {
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
        if (isHtmlResponse(data)) {
          reject(new Error('HTML response from API - rate limit'));
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
console.log('🔄 AUTONOMOUS FUND CONSOLIDATION (WITH RETRY)');
console.log('============================================================');
console.log('Enhanced: Auto-retry on rate limit (3 attempts)');
console.log('============================================================\n');

async function consolidateFunds() {
    try {
        console.log('Step 1: Getting account balances...');
        const account = await signedRequest('api.binance.com', 'GET', '/account');

        console.log('\n📊 Non-USDT Holdings:');
        let totalUSDT = 0;
        let assetsSold = 0;
        let assetsFailed = 0;

        for (const balance of account.balances) {
            const free = parseFloat(balance.free);
            const asset = balance.asset;

            if (free > 0 && asset !== 'USDT') {
                const symbol = `${asset}USDT`;
                console.log(`   ${asset}: ${free.toFixed(6)} (${symbol})`);

                try {
                    console.log(`   🔄 Selling ${asset}...`);

                    // Get current price first to estimate value
                    try {
                        const tickerRes = await getPrice(symbol);
                        const price = parseFloat(tickerRes.price);
                        const estimatedValue = free * price;
                        console.log(`   💰 Estimated: $${estimatedValue.toFixed(2)}`);
                    } catch (e) { /* ignore */ }

                    const result = await signedRequest('api.binance.com', 'POST', '/api/v3/order', {
                        symbol: symbol,
                        side: 'SELL',
                        type: 'MARKET',
                        quantity: free.toFixed(8)
                    });

                    const usdtReceived = parseFloat(result.cummulativeQuoteQty);
                    totalUSDT += usdtReceived;
                    assetsSold++;
                    console.log(`   ✅ Sold: +$${usdtReceived.toFixed(2)} USDT\n`);
                    await new Promise(r => setTimeout(r, 1000)); // 1s delay between orders

                } catch (err) {
                    assetsFailed++;
                    console.log(`   ❌ Sell failed: ${err.message}\n`);
                    console.log(`   💡 Will try again in next automation cycle\n`);
                }
            }
        }

        console.log('Step 2: Checking final USDT balance...');
        await new Promise(r => setTimeout(r, 2000));

        const finalAccount = await signedRequest('api.binance.com', 'GET', '/account');
        const finalUSDT = finalAccount.balances.find(b => b.asset === 'USDT');

        console.log('\n' + '='.repeat(60));
        console.log('📊 CONSOLIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Assets Sold: ${assetsSold}`);
        console.log(`Assets Failed: ${assetsFailed}`);
        console.log(`USDT Received: $${totalUSDT.toFixed(2)}`);
        console.log(`Total USDT: $${parseFloat(finalUSDT.free).toFixed(2)}`);
        console.log(`Trading Minimum: $5.00`);
        console.log(`Can Trade: ${parseFloat(finalUSDT.free) >= 5.00 ? '✅ YES' : '❌ NO'}`);

        // Check trading readiness
        if (parseFloat(finalUSDT.free) >= 5.00) {
            console.log('\n🎉 READY TO TRADE!');
            console.log('   Trading bot can now execute buy orders.');
        } else {
            console.log('\n⏳ Still need more funds or retry failed sells.');
        }

    } catch (error) {
        console.error('\n❌ Critical Error:', error.message);
        console.log('💡 Will retry automatically next cycle');
    }
}

function getPrice(symbol) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

consolidateFunds();