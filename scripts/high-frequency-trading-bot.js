// High-Frequency Trading Bot - Multiple Strategies
// Target: 80-100 trades per day
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(
  fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8')
);
const hftConfig = JSON.parse(
  fs.readFileSync('C:\\Users\\Karan\\.openclaw\\workspace\\config\\high-frequency-trading-config.json', 'utf8')
);

const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

const PAIRS = hftConfig.tradingPairs;
const STRATEGIES = hftConfig.strategies.filter(s => s.enabled);
const TEST_MODE = false;
const BASE_POSITION_PERCENT = 1; // 1% of capital per trade (smaller for more trades)

function sign(data) {
  return crypto.createHmac('sha256', API_SECRET).update(data).digest('hex');
}

// HTML Detection
function isHtmlResponse(data) {
  if (!data || typeof data !== 'string') return false;
  const trimmed = data.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

async function request(endpoint, params = {}, method = 'GET') {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await doRequest(endpoint, params, method);
        resolve(result);
        return;
      } catch (err) {
        if (attempt === 3) reject(err);
        else if (err.message?.includes('HTML') || err.message?.includes('rate'))
          await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  });
}

function doRequest(endpoint, params = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
    const signature = sign(queryString);

    const options = {
      hostname: 'api.binance.com',
      path: `${endpoint}?${queryString}&signature=${signature}`,
      method,
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
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(`${res.statusCode}: ${JSON.stringify(parsed)}`));
          else resolve(parsed);
        } catch (err) { reject(err); }
      });
    }).on('error', reject);
    req.end();
  });
}

async function getKlines(symbol, interval = '1m', limit = 100) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const klines = JSON.parse(data);
          resolve({
            symbol,
            prices: klines.map(k => parseFloat(k[4])),
            volumes: klines.map(k => parseFloat(k[5])),
            times: klines.map(k => k[0]),
            latestPrice: klines[klines.length - 1][4]
          });
        } catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

// === STRATEGIES ===

// 1. Scalping Strategy (30s - 1m)
function scalpingSignal(klines) {
  const prices = klines.prices;
  const volumes = klines.volumes;
  const latest = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const vol = volumes[volumes.length - 1];
  const avgVol = volumes.slice(-10).reduce((a, b) => a + b) / 10;

  const priceChange = (latest - prev) / prev;
  const volumeSurge = vol / avgVol;

  // Signal criteria:
  // - Price up 0.05%+ in last candle
  // - Volume surge 1.5x+
  // - Quick momentum
  if (priceChange > 0.0005 && volumeSurge > 1.5) {
    return {
      action: 'BUY',
      strength: volumeSurge > 2 ? 3 : 2,
      reason: `Scalping: +${(priceChange * 100).toFixed(3)}%, Vol ${(volumeSurge).toFixed(1)}x`
    };
  }

  // Exit: 0.1%+ drop
  if (priceChange < -0.001) {
    return {
      action: 'SELL',
      strength: 3,
      reason: `Scalping exit: -${(priceChange * 100).toFixed(3)}%`
    };
  }

  return { action: 'HOLD', strength: 0, reason: 'No scalping signal' };
}

// 2. Momentum Surge Strategy
function momentumSignal(klines) {
  const prices = klines.prices;
  const rsi = calculateRSI(prices, 14);
  const latest = prices[prices.length - 1];
  const sma20 = prices.slice(-20).reduce((a, b) => a + b) / 20;

  // Momentum surge:
  // - RSI below 30 and rising fast
  // - Price above SMA20
  // - Strong volume

  const rsiChange = calculateRSI(prices.slice(0, -1), 14);
  const rsiMomentum = rsi - rsiChange;

  if (rsi < 40 && rsiMomentum > 3 && latest > sma20) {
    return {
      action: 'BUY',
      strength: Math.min(rsiMomentum, 3),
      reason: `Momentum surge: RSI ${rsi.toFixed(1)} +${rsiMomentum.toFixed(1)}`
    };
  }

  if (rsi > 70) {
    return {
      action: 'SELL',
      strength: 2,
      reason: `Momentum exit: RSI ${rsi.toFixed(1)} overbought`
    };
  }

  return { action: 'HOLD', strength: 0, reason: 'No momentum signal' };
}

// 3. Mean Reversion Strategy
function meanReversionSignal(klines) {
  const prices = klines.prices;
  const latest = prices[prices.length - 1];
  const sma20 = prices.slice(-20).reduce((a, b) => a + b) / 20;
  const stdDev = Math.sqrt(
    prices.slice(-20).reduce((sum, p) => sum + Math.pow(p - sma20, 2), 0) / 20
  );

  const zScore = (latest - sma20) / stdDev;

  // Buy when 2+ standard deviations below mean
  if (zScore < -2) {
    return {
      action: 'BUY',
      strength: Math.min(Math.abs(zScore), 3),
      reason: `Mean reversion: z-score ${zScore.toFixed(2)} (oversold)`
    };
  }

  // Sell when 2+ standard deviations above mean
  if (zScore > 2) {
    return {
      action: 'SELL',
      strength: Math.min(zScore, 3),
      reason: `Mean reversion: z-score ${zScore.toFixed(2)} (overbought)`
    };
  }

  return { action: 'HOLD', strength: 0, reason: `z-score ${zScore.toFixed(2)}` };
}

// 4. Volume Spike Strategy
function volumeSpikeSignal(klines) {
  const prices = klines.prices;
  const volumes = klines.volumes;
  const latest = prices[prices.length - 1];
  const prev = prices[prices.length - 2];

  const vol = volumes[volumes.length - 1];
  const avgVol = volumes.slice(-20).reduce((a, b) => a + b) / 20;
  const surgeRatio = vol / avgVol;

  const priceMomentum = (latest - prev) / prev;

  // Volume spike with price momentum
  if (surgeRatio > 3 && priceMomentum > 0.001) {
    return {
      action: 'BUY',
      strength: Math.min(surgeRatio / 2, 3),
      reason: `Volume spike ${(surgeRatio).toFixed(1)}x + price momentum`
    };
  }

  return { action: 'HOLD', strength: 0, reason: `Volume ${(surgeRatio).toFixed(1)}x` };
}

// 5. MACD Crossover Strategy
function macdSignal(klines) {
  const prices = klines.prices;
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([...Array(prices.length - 9).fill(0), macdLine], 9);
  const histogram = macdLine - signalLine;

  const prevMacd = calculateEMA(prices.slice(0, -1), 12) - calculateEMA(prices.slice(0, -1), 26);

  // MACD crossover above signal line
  if (prevMacd <= signalLine && macdLine > signalLine) {
    return {
      action: 'BUY',
      strength: Math.min(Math.abs(histogram) / 100, 3),
      reason: 'MACD bullish crossover'
    };
  }

  // MACD crossover below signal line
  if (prevMacd >= signalLine && macdLine < signalLine) {
    return {
      action: 'SELL',
      strength: Math.min(Math.abs(histogram) / 100, 3),
      reason: 'MACD bearish crossover'
    };
  }

  return { action: 'HOLD', strength: 0, reason: `MACD hist ${histogram.toFixed(2)}` };
}

// Helpers
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + (avgGain / avgLoss)));
}

function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// Trade execution
class HighFrequencyTrader {
  constructor() {
    this.tradesToday = [];
    this.lastTradeTimes = {};
  }

  async buy(symbol, usdtAmount) {
    const params = {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty: usdtAmount.toFixed(2),
      timestamp: Date.now()
    };

    if (TEST_MODE) {
      console.log(`   [TEST] BUY ${symbol} $${usdtAmount.toFixed(2)}`);
      return { symbol, status: 'FILLED', test: true };
    }

    return await request('/api/v3/order', params, 'POST');
  }

  async sell(symbol, quantity) {
    const params = {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity.toFixed(8),
      timestamp: Date.now()
    };

    if (TEST_MODE) {
      console.log(`   [TEST] SELL ${symbol} ${quantity.toFixed(8)}`);
      return { symbol, status: 'FILLED', test: true };
    }

    return await request('/api/v3/order', params, 'POST');
  }

  async execute() {
    console.log('='.repeat(70));
    console.log(`[${new Date().toISOString()}] High-Frequency Trading Started`);
    console.log(`Target Trades/Day: ${hftConfig.highFrequencyTrading.targetTradesPerDay}`);
    console.log(`Strategies Active: ${STRATEGIES.length}`);
    console.log(`Pairs: ${PAIRS.length}`);
    console.log('='.repeat(70));

    let signalsFound = 0;
    let tradesExecuted = 0;

    try {
      // Get account
      const account = await request('/api/v3/account');
      const usdt = parseFloat(account.balances.find(b => b.asset === 'USDT').free);
      const capitalPerTrade = usdt * (BASE_POSITION_PERCENT / 100);

      console.log(`\n💰 USDT: $${usdt.toFixed(2)}`);
      console.log(`📊 Per Trade: $${capitalPerTrade.toFixed(2)} (${BASE_POSITION_PERCENT}%)\n`);

      for (const pair of PAIRS) {
        try {
          // Only check each pair every 2 minutes to avoid rate limiting
          const lastCheck = this.lastTradeTimes[pair] || 0;
          if (Date.now() - lastCheck < 120000) continue;

          // Get market data
          const klines1m = await getKlines(pair, '1m', 100);
          const klines5m = await getKlines(pair, '5m', 100);

          // Run all strategies
          const signals = [
            scalpingSignal(klines1m),
            momentumSignal(klines5m),
            meanReversionSignal(klines5m),
            volumeSpikeSignal(klines1m),
            macdSignal(klines5m)
          ];

          // Combine signals (score = sum of strengths)
          let buyScore = 0, sellScore = 0;
          const reasons = [];

          for (const signal of signals) {
            if (signal.action === 'BUY') {
              buyScore += signal.strength;
              reasons.push(signal.reason);
            } else if (signal.action === 'SELL') {
              sellScore += signal.strength;
              reasons.push(signal.reason);
            }
          }

          const netScore = buyScore - sellScore;

          // Execute if strong signal (threshold >= 2 for very aggressive trading)
          if (netScore >= 2 && capitalPerTrade >= 1) {
            signalsFound++;
            console.log(`\n🚀 ${pair} - BUY SIGNAL (Strength: ${netScore}/15)`);
            console.log(`   Reasons: ${reasons.slice(0, 3).join(', ')}`);

            try {
              await this.buy(pair, capitalPerTrade);
              tradesExecuted++;
              this.lastTradeTimes[pair] = Date.now();
              console.log(`   ✅ Trade executed\n`);
            } catch (err) {
              console.log(`   ❌ Order failed: ${err.message}\n`);
            }
          } else if (sellScore >= 2) {
            // Check if we have position
            const asset = pair.replace('USDT', '');
            const balance = account.balances.find(b => b.asset === asset);

            if (balance && parseFloat(balance.free) > 0) {
              signalsFound++;
              console.log(`\n🔻 ${pair} - SELL SIGNAL (Strength: ${sellScore}/15)`);
              console.log(`   Reasons: ${reasons.slice(0, 3).join(', ')}`);

              try {
                await this.sell(pair, parseFloat(balance.free));
                tradesExecuted++;
                this.lastTradeTimes[pair] = Date.now();
                console.log(`   ✅ Trade executed\n`);
              } catch (err) {
                console.log(`   ❌ Order failed: ${err.message}\n`);
              }
            }
          } else {
            console.log(`   ${pair}: HOLD (net score: ${netScore})`);
          }

        } catch (err) {
          console.log(`   ❌ ${pair} error: ${err.message}`);
        }
      }

      console.log('\n' + '='.repeat(70));
      console.log(`📊 SUMMARY:`);
      console.log(`   Signals Found: ${signalsFound}`);
      console.log(`   Trades Executed: ${tradesExecuted}`);
      console.log(`   Pairs Checked: ${PAIRS.length}`);
      console.log(`   Strategies Used: ${STRATEGIES.map(s => s.name).join(', ')}`);
      console.log('='.repeat(70));

    } catch (error) {
      console.error('\n❌ Critical Error:', error.message);
    }
  }
}

// Run trading
const trader = new HighFrequencyTrader();
trader.execute();