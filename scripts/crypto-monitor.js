/**
 * Automated Crypto Monitoring - Runs via Cron
 * Checks for buy signals every 5 minutes
 * Sends Telegram alerts when signals trigger
 */

const https = require('https');
const { exec } = require('child_process');

// Configuration
const TARGETS = ['SOLUSDT', 'ETHUSDT'];
const RSI_THRESHOLD = 30;
const RSI_EXIT_OVERSOLD = 30;
const MIN_SIGNAL_STRENGTH = 2;

// Get Telegram token and chat ID from environment
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = '8284494839';

function getKlines(symbol, interval = '5m', limit = 20) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const klines = JSON.parse(data);
          resolve({
            symbol,
            latestPrice: parseFloat(klines[klines.length-1][4]),
            prices: klines.map(k => parseFloat(k[4])),
            volumes: klines.map(k => parseFloat(k[7]))
          });
        } catch (err) { reject(err); }
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

function sendTelegramAlert(message) {
  return new Promise((resolve, reject) => {
    if (!TELEGRAM_TOKEN) {
      console.log('⚠️ No Telegram token, would send:', message);
      resolve('No token');
      return;
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const postData = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) { reject(err); }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function monitor() {
  console.log(`\n[${new Date().toISOString()}] Starting crypto monitoring...\n`);
  
  const alerts = [];
  
  for (const symbol of TARGETS) {
    try {
      const data = await getKlines(symbol);
      const rsi = calculateRSI(data.prices);
      const prevPrice = data.prices[data.prices.length - 2];
      const currentPrice = data.latestPrice;
      const priceChange = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);
      
      const avgVolume = data.volumes.slice(-10, -1).reduce((a, b) => a + b, 0) / 9;
      const volumeSpike = data.volumes[data.volumes.length - 1] > avgVolume * 1.3;
      
      let signalStrength = 0;
      let signals = [];
      
      if (rsi > RSI_EXIT_OVERSOLD && rsi < 40) {
        signalStrength++;
        signals.push('RSI exiting oversold');
      }
      if (parseFloat(priceChange) > 0.3) {
        signalStrength++;
        signals.push('Price up >0.3%');
      }
      if (volumeSpike) {
        signalStrength++;
        signals.push('Volume spike');
      }
      if (rsi > 32) {
        signalStrength++;
      }
      
      const isBuySignal = signalStrength >= MIN_SIGNAL_STRENGTH && rsi > RSI_EXIT_OVERSOLD;
      
      console.log(`${symbol}: Price=$${currentPrice.toFixed(2)} (${priceChange}%) | RSI=${rsi.toFixed(2)} | Volume=${volumeSpike ? 'SPIKE' : 'OK'} | ${isBuySignal ? '🟢 BUY SIGNAL' : '⏳ Waiting'}`);
      
      if (isBuySignal) {
        const alertMsg = `🚨 <b>BUY SIGNAL: ${symbol}</b>\n\n` +
          `💵 Price: $${currentPrice.toFixed(2)} (${priceChange}%)\n` +
          `📊 RSI: ${rsi.toFixed(2)} (exiting oversold)\n` +
          `📈 Signals: ${signals.join(', ')}\n` +
          `⚡ Strength: ${signalStrength}/3\n\n` +
          `🎯 Action: Consider BUYING now!\n` +
          `📦 Position size: Calculate with 2% risk`;
        
        alerts.push(alertMsg);
        console.log(`\n→ Buy signal detected for ${symbol}!\n`);
      }
      
    } catch (err) {
      console.error(`Error with ${symbol}:`, err.message);
    }
  }
  
  if (alerts.length > 0) {
    console.log('\n📤 Sending Telegram alerts...');
    for (const alert of alerts) {
      try {
        await sendTelegramAlert(alert);
        console.log('✅ Alert sent');
      } catch (err) {
        console.error('❌ Failed to send:', err.message);
      }
    }
  } else {
    console.log('\n✅ No buy signals. Continue monitoring.');
  }
  
  console.log(`\n[${new Date().toISOString()}] Monitoring complete.\n`);
}

monitor().catch(console.error);