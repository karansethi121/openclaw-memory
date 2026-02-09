// Fetch Binance Klines (Candlestick) Data
// Gets historical price data for technical analysis

const https = require('https');

function getKlines(symbol, interval = '1h', limit = 100) {
  return new Promise((resolve, reject) => {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const klines = JSON.parse(data);
          // Extract only closing prices for analysis
          const closingPrices = klines.map(k => parseFloat(k[4]));
          resolve({
            symbol,
            interval,
            count: klines.length,
            prices: closingPrices,
            latestPrice: closingPrices[closingPrices.length - 1],
            data: klines // Full kline data
          });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Test with SOL/USDT and ETH/USDT
async function main() {
  const pairs = ['SOLUSDT', 'ETHUSDT'];
  
  for (const symbol of pairs) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Fetching ${symbol} 1H candles...\n`);
    const data = await getKlines('SOLUSDT', '1h', 50);
    
    console.log(`Symbol: ${data.symbol}`);
    console.log(`Interval: ${data.interval}`);
    console.log(`Candles fetched: ${data.count}`);
    console.log(`Current price: $${data.latestPrice.toFixed(2)}\n`);
    
    console.log('Last 10 prices:');
    data.prices.slice(-10).forEach((price, i) => {
      console.log(`  ${(i + 1)}. $${price.toFixed(2)}`);
    });
    
    // Now calculate indicators
    const TechIndicators = require('./technical-indicators');
    const signal = TechIndicators.generateSignal(data.prices);
    
    console.log('\n=== TRADING SIGNALS ===\n');
    console.log(`Current Price: $${signal.currentPrice.toFixed(2)}`);
    console.log(`RSI (14): ${signal.rsi.toFixed(2)}`);
    console.log(`MACD Line: ${signal.macd.macdLine.toFixed(4)}`);
    console.log(`Signal Line: ${signal.macd.signalLine.toFixed(4)}`);
    console.log(`Trend: ${signal.macd.trend}`);
    console.log(`EMA (50): $${signal.ema50.toFixed(2)}\n`);
    
    console.log('=== SIGNALS ===');
    console.log(`RSI: ${signal.rsi}`);
    console.log(`MACD: ${signal.macd}`);
    console.log(`EMA: ${signal.ema}`);
    console.log(`\nOVERALL SIGNAL: ${signal.overall} ✅`);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();