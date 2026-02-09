// Check Multiple Pairs for Trading Signals
// Evaluates SOL/USDT and ETH/USDT simultaneously

const https = require('https');

function getKlines(symbol, interval = '1h', limit = 50) {
  return new Promise((resolve, reject) => {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const klines = JSON.parse(data);
          const prices = klines.map(k => parseFloat(k[4]));
          resolve({
            symbol,
            latestPrice: prices[prices.length - 1],
            prices
          });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(prices, period = 14) {
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

async function checkAllPairs() {
  const pairs = ['SOLUSDT', 'ETHUSDT'];
  const TechIndicators = require('./technical-indicators');
  
  for (const symbol of pairs) {
    try {
      const data = await getKlines(symbol);
      const signal = TechIndicators.generateSignal(data.prices);
      
      console.log(`\n${'='.repeat(50)}`);
      console.log(`${symbol} - LIVE TRADING SIGNAL`);
      console.log(`${'='.repeat(50)}\n`);
      console.log(`Current Price: $${signal.currentPrice.toFixed(2)}`);
      console.log(`RSI (14): ${signal.rsi.toFixed(2)}`);
      console.log(`MACD: ${signal.macd.trend} (${signal.macd.histogram.toFixed(4)})`);
      console.log(`EMA (50): $${signal.ema50.toFixed(2)}\n`);
      
      let rsiStatus = signal.rsi < 30 ? '🟢 OVERSOLD - BUY SIGNAL!' :
                     signal.rsi > 70 ? '🔴 OVERBOUGHT - SELL!' : '⚪ NEUTRAL';
      
      let trendStatus = signal.macd.trend === 'UP' ? '🟢 UPTREND' : '🔴 DOWNTREND';
      
      console.log(`RSI Status: ${rsiStatus}`);
      console.log(`Trend: ${trendStatus}`);
      console.log(`\nOVERALL SIGNAL: ${signal.overall}`);
      
      // Analysis
      if (signal.rsi < 30) {
        console.log(`⭐ OPPORTUNITY: Price dropped ${((signal.ema50 - signal.currentPrice) / signal.ema50 * 100).toFixed(1)}% below EMA`);
        console.log(`   Could rebound 3-5% to $${(signal.currentPrice * 1.04).toFixed(2)}`);
      }
      
    } catch (err) {
      console.error(`Error with ${symbol}:`, err.message);
    }
  }
}

checkAllPairs();