// Entry Trigger Detector - Monitors for Buy Signals
// Automatically detects when RSI exits oversold territory

const https = require('https');

function getKlines(symbol, interval = '5m', limit = 20) {
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
            prices,
            volumes: klines.map(k => parseFloat(k[7]))
          });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
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

async function checkBuySignals() {
  const targets = ['SOLUSDT', 'ETHUSDT'];
  let buySignals = [];
  
  for (const symbol of targets) {
    try {
      const data = await getKlines(symbol, '5m', 20); // 5-min candles for faster detection
      const rsi = calculateRSI(data.prices);
      const prevPrice = data.prices[data.prices.length - 2];
      const currentPrice = data.prices[data.prices.length - 1];
      const priceChange = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);
      
      // Volume check
      const avgVolume = data.volumes.slice(-10, -1).reduce((a, b) => a + b, 0) / 9;
      const currentVolume = data.volumes[data.volumes.length - 1];
      const volumeSpike = currentVolume > avgVolume * 1.5;
      
      // Buy signal conditions
      let signal = null;
      let signalStrength = 0;
      
      if (rsi > 30 && rsi < 40) {
        signal = 'RSI exiting oversold';
        signalStrength += 1;
      }
      
      if (priceChange > 0.5) {
        signal = 'Price momentum UP';
        signalStrength += 1;
      }
      
      if (volumeSpike) {
        signal = 'Volume spike detected';
        signalStrength += 1;
      }
      
      if (rsi > 32) {
        signalStrength += 1; // Higher confidence
      }
      
      const isReady = rsi > 30 && signalStrength >= 2;
      
      console.log(`\n${symbol}`);
      console.log(`  Price: $${currentPrice.toFixed(2)} (${priceChange}%)`);
      console.log(`  RSI: ${rsi.toFixed(2)}`);
      console.log(`  Volume: ${volumeSpike ? '⚡ SPIKE' : 'normal'}`);
      console.log(`  Status: ${isReady ? '🟢 BUY READY' : '⏳ WAITING'}`);
      console.log(`  Signal: ${signal || 'None'} (Strength: ${signalStrength}/3)`);
      
      if (isReady) {
        buySignals.push({
          symbol,
          price: currentPrice,
          rsi,
          signal,
          signalStrength
        });
      }
      
    } catch (err) {
      console.error(`Error with ${symbol}:`, err.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (buySignals.length > 0) {
    console.log('🚨 BUY SIGNALS DETECTED!');
    buySignals.forEach(sig => {
      console.log(`\n⚡ ${sig.symbol} - BUY NOW`);
      console.log(`   Price: $${sig.price.toFixed(2)}`);
      console.log(`   RSI: ${sig.rsi.toFixed(2)}`);
      console.log(`   Signal: ${sig.signal} (Strength: ${sig.signalStrength}/3)`);
    });
    console.log('\n💎 Execute buy orders immediately!');
  } else {
    console.log('✅ No buy signals yet. Continue monitoring.');
    console.log('💡 RSI must cross 30 with momentum for buy signal.');
  }
}

checkBuySignals();