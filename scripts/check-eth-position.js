// Check current ETH position status

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// Read config
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

// Position info (from first trade)
const position = {
  pair: 'ETHUSDT',
  quantity: 0.002700,
  entryPrice: 1925.00,
  stopLoss: 1886.50, // -2%
  takeProfit: 1982.75 // +3%
};

async function getPrice(symbol) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    });
  });
}

async function getAccount() {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const params = new URLSearchParams({ timestamp: timestamp.toString() });
    const signature = crypto.createHmac('sha256', API_SECRET).update(params.toString()).digest('hex');

    const options = {
      hostname: 'api.binance.com',
      path: `/api/v3/account?${params.toString()}&signature=${signature}`,
      headers: { 'X-MBX-APIKEY': API_KEY }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) { reject(err); }
      });
    }).on('error', reject).end();
  });
}

async function checkPosition() {
  console.log('\n' + '='.repeat(70));
  console.log('💰 CURRENT ETH POSITION STATUS');
  console.log('='.repeat(70) + '\n');

  const [price, account] = await Promise.all([
    getPrice(position.pair),
    getAccount()
  ]);

  const currentPrice = parseFloat(price.price);
  const positionValue = currentPrice * position.quantity;
  const profitLoss = positionValue - (position.entryPrice * position.quantity);
  const profitLossPercent = (profitLoss / (position.entryPrice * position.quantity)) * 100;

  const ethBalance = account.balances.find(b => b.asset === 'ETH');
  const usdtBalance = account.balances.find(b => b.asset === 'USDT');

  console.log('📍 POSITION DETAILS:');
  console.log(`   Pair: ${position.pair}`);
  console.log(`   Quantity: ${position.quantity} ETH`);
  console.log(`   Entry Price: $${position.entryPrice.toFixed(2)}`);
  console.log(`   Current Price: $${currentPrice.toFixed(2)} (${((currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2)}%)`);
  console.log(`   Position Value: $${positionValue.toFixed(2)}\n`);

  const icon = profitLoss >= 0 ? '🟢' : '🔴';
  console.log(`💵 PROFIT / LOSS:`);
  console.log(`   ${icon} P/L: $${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)`);
  console.log(`   ${icon} Total Value: $${positionValue.toFixed(2)}\n`);

  console.log('🎯 EXIT POINTS:');
  console.log(`   🟢 Take Profit: $${position.takeProfit.toFixed(2)} (+3% = +$0.15)`);
  console.log(`   🔴 Stop Loss: $${position.stopLoss.toFixed(2)} (-2% = -$0.10)\n`);

  const distToTP = position.takeProfit - currentPrice;
  const distToSL = currentPrice - position.stopLoss;

  console.log('📏 DISTANCE FROM TARGETS:');
  console.log(`   To Take Profit: $${distToTP.toFixed(2)} (${(distToTP / currentPrice * 100).toFixed(2)}%) ${distToTP > 0 ? '📈' : ''}`);
  console.log(`   To Stop Loss: $${distToSL.toFixed(2)} (${(distToSL / currentPrice * 100).toFixed(2)}%) ${distToSL < 0 ? '⚠️' : '✅'}\n`);

  console.log('💼 BALANCE:');
  console.log(`   ETH Balance: ${parseFloat(ethBalance.free).toFixed(6)} ETH`);
  console.log(`   USDT Available: $${parseFloat(usdtBalance.free).toFixed(2)}`);
  console.log(`   Total Value: $${(parseFloat(ethBalance.free) * currentPrice + parseFloat(usdtBalance.free)).toFixed(2)}\n`);

  console.log('='.repeat(70));
  console.log('✅ POSITION CHECK COMPLETE');
  console.log('='.repeat(70) + '\n');
}

checkPosition().catch(console.error);