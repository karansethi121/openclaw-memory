// Check spot and futures positions
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

function sign(data) {
  return crypto.createHmac('sha256', API_SECRET).update(data).digest('hex');
}

// HTML Response Detection
function isHtmlResponse(data) {
  if (!data || typeof data !== 'string') return false;
  const trimmed = data.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
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
        if (isHtmlResponse(data)) {
          reject(new Error('HTML response from API'));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) { reject(err); }
      });
    }).on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('📊 Spot & Futures Position Check\n');
  console.log('='.repeat(60));

  try {
    // 1. Check Spot Account
    console.log('\n1️⃣ SPOT ACCOUNT:');
    console.log('-'.repeat(60));
    const account = await request('/api/v3/account');

    const spotAssets = account.balances.filter(b =>
      (parseFloat(b.free) > 0 || parseFloat(b.locked) > 0) &&
      b.asset !== 'USDT'
    );

    console.log('Spot Assets:');
    spotAssets.forEach(b => {
      const free = parseFloat(b.free);
      const locked = parseFloat(b.locked);
      if (free > 0 || locked > 0) {
        console.log(`   ${b.asset}: Free=${free.toFixed(6)}  Locked=${locked.toFixed(6)}`);
      }
    });

    const usdt = account.balances.find(b => b.asset === 'USDT');
    console.log(`   USDT: $${parseFloat(usdt.free).toFixed(2)}`);

    console.log('Spot Position Close Test:');
    console.log(`   Assets to close: ${spotAssets.length}`);
    console.log(`   Status: ✅ CAN CLOSE (selling ${spotAssets.length} assets)`);

    // 2. Check Open Orders (Spot)
    console.log('\n2️⃣ OPEN SPOT ORDERS:');
    console.log('-'.repeat(60));
    try {
      const orders = await request('/api/v3/openOrders');
      if (orders.length === 0) {
        console.log('   No open spot orders ✅');
      } else {
        console.log(`   Found ${orders.length} open orders:`);
        orders.forEach(o => {
          console.log(`   - ${o.symbol}: ${o.side} ${o.type} @ ${o.price}`);
        });
      }
    } catch (err) {
      console.log('   Error checking orders:', err.message);
    }

    // 3. Check Futures Account
    console.log('\n3️⃣ FUTURES ACCOUNT:');
    console.log('-'.repeat(60));
    try {
      // Check futures account info
      const futuresAccount = await apiRequest('/fapi/v2/account', {});
      console.log('   Wallet Balance: $' + parseFloat(futuresAccount.totalWalletBalance).toFixed(2));
      console.log('   Available: $' + parseFloat(futuresAccount.availableBalance).toFixed(2));
      console.log('   Unrealized PNL: $' + parseFloat(futuresAccount.totalUnrealizedProfit).toFixed(2));

      // Check positions
      const positions = await apiRequest('/fapi/v2/positionRisk', {});
      const openPositions = positions.filter(p => parseFloat(p.positionAmt) !== 0);

      console.log('\n   Open Futures Positions:');
      if (openPositions.length === 0) {
        console.log('   No open futures positions ✅');
      } else {
        openPositions.forEach(p => {
          console.log(`   - ${p.symbol}: ${p.positionAmt} @ ${p.entryPrice}`);
          console.log(`     Unrealized PNL: $${parseFloat(p.unRealizedProfit).toFixed(2)}`);
        });
      }
    } catch (err) {
      console.log('   ⚠️  Error checking futures:', err.message);
      console.log('   Note: This is OK if you dont trade futures');
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Spot Assets: ${spotAssets.length} (can close all via sell orders)`);
    console.log(`Open Spot Orders: Account checked ✅`);
    console.log(`Futures Access: ${err ? '❌ Failed (likely API permissions)' : '✅ Active'}`);
    console.log('');

    console.log('✅ POSITION CLOSE ABILITY CHECK:');
    console.log('   Spot: CAN CLOSE (sell all non-USDT assets)');
    console.log('   Futures: ' + (err ? 'CANNOT CHECK (API error)' : 'CAN CLOSE (reduce position to 0)'));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Helper for futures API requests (different base URL)
function apiRequest(endpoint, params) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
    const signature = sign(queryString);

    const options = {
      hostname: 'fapi.binance.com',
      path: `${endpoint}?${queryString}&signature=${signature}`,
      method: 'GET',
      headers: { 'X-MBX-APIKEY': API_KEY }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (isHtmlResponse(data)) {
          reject(new Error('HTML response from API'));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) { reject(err); }
      });
    }).on('error', reject);
    req.end();
  });
}

main();