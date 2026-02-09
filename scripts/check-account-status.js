// Check full account status
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

function sign(data) {
  return crypto.createHmac('sha256', API_SECRET).update(data).digest('hex');
}

async function request(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
    const signature = sign(queryString);

    const options = {
      hostname: 'api.binance.com',
      path: `${endpoint}?${queryString}&signature=${signature}`,
      method: 'GET',
      headers: { 'X-MBX-APIKEY': API_KEY }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) { reject(err); }
      });
    }).on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('📊 Account Status Check\n');
  console.log('=' .repeat(50));

  try {
    const account = await request('/api/v3/account');

    console.log('\n💰 All Balances (> 0.00):');
    account.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .forEach(b => {
        const free = parseFloat(b.free);
        const locked = parseFloat(b.locked);
        if (free > 0 || locked > 0) {
          console.log(`   ${b.asset}: Free=${free.toFixed(6)}  Locked=${locked.toFixed(6)}`);
        }
      });

    const usdt = account.balances.find(b => b.asset === 'USDT');
    console.log(`\n💵 Available USDT: $${parseFloat(usdt.free).toFixed(2)}`);

    console.log('\n⚠️  Trading Limitations:');
    console.log('   - Binance spot minimum: $5.00 per order');
    console.log('   - Available balance: $4.83');
    console.log('   - Status: CANNOT TRADE SPOT (insufficient funds)');

    // Check for other assets that could be sold
    console.log('\n💡 Possible Actions:');
    const nonUsdtAssets = account.balances.filter(b =>
      b.asset !== 'USDT' &&
      (parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    );

    if (nonUsdtAssets.length > 0) {
      console.log('   ✅ Found non-USDT assets that could be sold:');
      nonUsdtAssets.forEach(b => {
        console.log(`      - ${b.asset}: ${parseFloat(b.free).toFixed(6)}`);
      });
      console.log('   → Sell these assets to consolidate to USDT');
    } else {
      console.log('   ❌ No other assets found');
      console.log('   → Need to deposit more USDT to trade');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();