// Binance Trading Bot - Full Integration
// Executes trades automatically using Binance API

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// Read configuration directly from config file (avoids session cache issues)
const CONFIG_PATH = 'C:\\Users\\Karan\\.openclaw\\openclaw.json';
let API_KEY, API_SECRET, TEST_MODE;

try {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  API_KEY = config.env.BINANCE_API_KEY || '';
  API_SECRET = config.env.BINANCE_API_SECRET || '';
  TEST_MODE = config.env.TEST_MODE !== 'false'; // Start in test mode
} catch (error) {
  console.log('⚠️  Warning: Could not read config file, using process env fallback');
  API_KEY = process.env.BINANCE_API_KEY || '';
  API_SECRET = process.env.BINANCE_API_SECRET || '';
  TEST_MODE = process.env.TEST_MODE !== 'false';
}

// HTML Response Detection Function
function isHtmlResponse(data) {
  if (!data || typeof data !== 'string') return false;
  const trimmed = data.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

// Trading parameters
const INITIAL_CAPITAL = 20.00; // USD
const MAX_POSITIONS = 4;
const POSITION_SIZE = 5.00; // USD per position ($20 / 4)
const STOP_LOSS_PERCENT = 0.02; // 2%
const TAKE_PROFIT_PERCENT = 0.03; // 3%
const MIN_SIGNAL_STRENGTH = 2;

// Pairs to trade
const PAIRS = ['SOLUSDT', 'ETHUSDT', 'BTCUSDT', 'BNBUSDT'];

class BinanceTrader {
  constructor() {
    this.BASE_URL = 'https://api.binance.com';
  }

  // Generate signature for signed requests
  sign(data) {
    return crypto.createHmac('sha256', API_SECRET).update(data).digest('hex');
  }

  // Make authenticated request to Binance
  async request(endpoint, params = {}, method = 'GET') {
    if (!API_KEY || !API_SECRET) {
      throw new Error('Binance API credentials not configured');
    }

    if (method === 'GET') {
      const queryString = new URLSearchParams(params).toString();
      const signature = this.sign(queryString);
      const fullUrl = `${this.BASE_URL}${endpoint}?${queryString}&signature=${signature}`;
      return await this.httpRequest(fullUrl, { method: 'GET', headers: { 'X-MBX-APIKEY': API_KEY } });
    } else {
      const queryString = new URLSearchParams(params).toString();
      const signature = this.sign(queryString);
      return await this.httpRequest(
        `${this.BASE_URL}${endpoint}?${queryString}&signature=${signature}`,
        { method: 'POST', headers: { 'X-MBX-APIKEY': API_KEY, 'Content-Type': 'application/json' } }
      );
    }
  }

  async httpRequest(url, options) {
    const operation = options.method || 'API Request';
    return new Promise((resolve, reject) => {
      https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Check for HTML response (API error)
          if (isHtmlResponse(data)) {
            console.log(`❌ ${operation}: API returned HTML instead of JSON`);
            console.log('   → Likely: rate limiting, maintenance, or auth error');
            console.log('   → Will retry next automation cycle');
            reject(new Error('HTML response from API'));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`Binance API Error ${res.statusCode}: ${JSON.stringify(parsed)}`));
            } else {
              resolve(parsed);
            }
          } catch (err) {
            console.log(`❌ ${operation}: JSON parse failed - ${err.message}`);
            reject(err);
          }
        });
      }).on('error', reject).end();
    });
  }

  // Get account balances
  async getAccount() {
    const timestamp = Date.now();
    const params = { timestamp };
    const account = await this.request('/api/v3/account', params);
    return account;
  }

  // Get current price
  async getPrice(symbol) {
    return new Promise((resolve, reject) => {
      https.get(`${this.BASE_URL}/api/v3/ticker/price?symbol=${symbol}`, (res) => {
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

  // Get candlestick data
  async getKlines(symbol, interval = '1h', limit = 50) {
    return new Promise((resolve, reject) => {
      https.get(`${this.BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const klines = JSON.parse(data);
            const prices = klines.map(k => parseFloat(k[4]));
            resolve({ symbol, prices, latestPrice: prices[prices.length - 1] });
          } catch (err) { reject(err); }
        });
      }).on('error', reject);
    });
  }

  // Get 24h ticker stats (for volume analysis)
  async get24hStats(symbol) {
    return new Promise((resolve, reject) => {
      https.get(`${this.BASE_URL}/api/v3/ticker/24hr?symbol=${symbol}`, (res) => {
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

  // Calculate RSI
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + (avgGain / avgLoss)));
  }

  // Generate trading signal (aligned with entry trigger detector)
  generateSignal(rsi, currentPrice, ema50, prevPrice = null, prevRsi = null) {
    let signalStrength = 0;
    let signals = [];

    // RSI oversold (strong BUY)
    if (rsi < 30) {
      signals.push('RSI oversold - BUY');
      signalStrength += 2;
    }
    // RSI exiting oversold (momentum BUY)
    else if (prevRsi && prevRsi < 30 && rsi > 30) {
      signals.push('RSI exiting oversold - BUY');
      signalStrength += 2;
    }
    // RSI overbought (SELL)
    else if (rsi > 70) {
      signals.push('RSI overbought - WAIT');
      signalStrength -= 1;
    }

    // EMA trend
    if (currentPrice > ema50) {
      signals.push('Price above EMA - uptrend');
      signalStrength += 1;
    } else {
      signals.push('Price below EMA - downtrend');
      signalStrength -= 1;
    }

    // Price momentum UP
    if (prevPrice && currentPrice > prevPrice) {
      const momentum = (currentPrice - prevPrice) / prevPrice;
      if (momentum > 0.002) { // > 0.2% move up
        signals.push('Price momentum UP');
        signalStrength += 2;
      } else if (momentum > 0.001) { // > 0.1% move up
        signals.push('Price moving UP');
        signalStrength += 1;
      }
    }

    return {
      action: signalStrength >= 2 ? 'BUY' : signalStrength <= -2 ? 'SELL' : 'HOLD',
      strength: signalStrength,
      signals: signals.join(', ')
    };
  }

  // Place buy order
  async buy(symbol, quoteOrderQty) {
    const timestamp = Date.now();
    const params = {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty: quoteOrderQty.toFixed(2),
      timestamp
    };

    if (TEST_MODE) {
      console.log(`[TEST MODE] Would BUY ${symbol} for $${quoteOrderQty.toFixed(2)}`);
      return { symbol, side: 'BUY', price: 0, executedQty: quoteOrderQty, test: true };
    }

    return await this.request('/api/v3/order', params, 'POST');
  }

  // Place sell order
  async sell(symbol, quantity) {
    const timestamp = Date.now();
    const params = {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity.toFixed(6),
      timestamp
    };

    if (TEST_MODE) {
      console.log(`[TEST MODE] Would SELL ${symbol} quantity: ${quantity.toFixed(6)}`);
      return { symbol, side: 'SELL', price: 0, executedQty: quantity, test: true };
    }

    return await this.request('/api/v3/order', params, 'POST');
  }

  // Calculate position size based on available USDT
  calculatePositionSize(usdtBalance) {
    // Use 100% of available balance since we only have $4.83
    // Binance minimum is $5 for most pairs, but let's try with current balance
    return usdtBalance * 0.95; // Leave 5% buffer for fees
  }

  // Main trading logic
  async trade() {
    console.log('\n' + '='.repeat(60));
    console.log(`[${new Date().toISOString()}] Autonomous Trading Started`);
    console.log(`Mode: ${TEST_MODE ? 'TEST (No real trades)' : 'LIVE REAL MONEY'}`);
    console.log(`Capital to use: $${INITIAL_CAPITAL}`);
    console.log('='.repeat(60) + '\n');

    try {
      // Get account
      const account = await this.getAccount();
      const usdtBalance = account.balances.find(b => b.asset === 'USDT');
      console.log(`💰 Available USDT: $${parseFloat(usdtBalance.free).toFixed(2)}`);

      // Check each pair
      for (const pair of PAIRS) {
        try {
          console.log(`\n📊 Analyzing ${pair}...`);

          const klines = await this.getKlines(pair, '1h', 50);
          const rsi = this.calculateRSI(klines.prices);
          const currentPrice = klines.latestPrice;
          const prevPrice = klines.prices[klines.prices.length - 2];

          // Calculate previous RSI for momentum detection
          const prevRsi = this.calculateRSI(klines.prices.slice(0, -1));

          // Simple EMA50
          let ema50 = currentPrice;
          const k = 2 / 51;
          for (let i = 1; i < Math.min(50, klines.prices.length); i++) {
            ema50 = klines.prices[i] * k + ema50 * (1 - k);
          }

          console.log(`   Price: $${currentPrice.toFixed(2)}`);
          console.log(`   RSI: ${rsi?.toFixed(2) || 'N/A'}`);
          console.log(`   EMA50: $${ema50.toFixed(2)}`);

          // Generate signal (with momentum and previous values)
          let signal = this.generateSignal(rsi, currentPrice, ema50, prevPrice, prevRsi);

          // Check volume (24h stats) - for volume spike detection
          try {
            const volumeData = await this.get24hStats(pair);
            if (volumeData) {
              const currentVolume = parseFloat(volumeData.volume);
              const avgVolume = parseFloat(volumeData.quoteVolume) / parseFloat(volumeData.count || 1);
              const volumeRatio = currentVolume / avgVolume;

              if (volumeRatio > 2.0) {
                console.log(`   Volume: ⚡ SPIKE (${volumeRatio.toFixed(1)}x normal)`);
                signal.strength += 3;
                signal.signals += ', Volume spike';
                signal.action = signal.strength >= 2 ? 'BUY' : signal.action;
              } else if (volumeRatio > 1.5) {
                console.log(`   Volume: ↑ Higher (${volumeRatio.toFixed(1)}x normal)`);
                signal.strength += 1;
                signal.signals += ', Elevated volume';
              } else {
                console.log(`   Volume: normal`);
              }
            }
          } catch (err) {
            console.log(`   Volume: normal`);
          }

          console.log(`   Signal: ${signal.action} (Strength: ${signal.strength})`);
          console.log(`   Reason: ${signal.signals}`);

          // Execute trade if signal is strong enough
          if (signal.action === 'BUY' && Math.abs(signal.strength) >= MIN_SIGNAL_STRENGTH) {
            const positionSize = this.calculatePositionSize(parseFloat(usdtBalance.free));

            if (positionSize >= 5.00) {
              console.log(`\n   ⚡ Buying ${pair} with $${positionSize.toFixed(2)}...`);
              const order = await this.buy(pair, positionSize);
              console.log(`   ✅ Order executed: ${JSON.stringify(order)}`);

              // Calculate expected exit points
              const stopLoss = currentPrice * (1 - STOP_LOSS_PERCENT);
              const takeProfit = currentPrice * (1 + TAKE_PROFIT_PERCENT);

              console.log(`\n   📈 Exit Plan:`);
              console.log(`   🟢 Take Profit: $${takeProfit.toFixed(2)} (+${TAKE_PROFIT_PERCENT*100}%)`);
              console.log(`   🔴 Stop Loss: $${stopLoss.toFixed(2)} (-${STOP_LOSS_PERCENT*100}%)`);
            } else {
              console.log(`\n   ⚠️ Insufficient balance (need $5.00, have $${positionSize.toFixed(2)})`);
            }
          } else if (signal.action === 'SELL' && Math.abs(signal.strength) >= 2) {
            // Check if we have this asset
            const asset = pair.replace('USDT', '');
            const balance = account.balances.find(b => b.asset === asset);

            if (balance && parseFloat(balance.free) > 0) {
              console.log(`\n   ⚡ Selling ${asset}...`);
              const order = await this.sell(pair, parseFloat(balance.free));
              console.log(`   ✅ Order executed: ${JSON.stringify(order)}`);
            }
          } else {
            console.log(`   ⏳ No trade - signal too weak`);
          }

        } catch (err) {
          console.error(`   ❌ Error with ${pair}: ${err.message}`);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log(`✅ Trading cycle complete`);
      console.log(`Next run: 1 hour from now`);
      console.log('='.repeat(60));

    } catch (err) {
      console.error('❌ Trading error:', err.message);
      if (err.message.includes('HTML')) {
        console.log('💡 Tip: Check if API is rate-limited or under maintenance');
      }
    }
  }
}

// Main execution
if (require.main === module) {
  const trader = new BinanceTrader();

  if (!API_KEY || !API_SECRET) {
    console.error('❌ ERROR: Binance API credentials not set!');
    console.error('\nTo set up your Binance API:');
    console.error('1. Go to https://www.binance.com/en/my/settings/api-management');
    console.error('2. Create new API key');
    console.error('3. Enable spot trading permissions');
    console.error('4. Add these environment variables:');
    console.error('   BINANCE_API_KEY=your_api_key_here');
    console.error('   BINANCE_API_SECRET=your_api_secret_here');
    console.error('   TEST_MODE=false (to enable real trading)');
    process.exit(1);
  }

  trader.trade().catch(console.error);
}

module.exports = BinanceTrader;