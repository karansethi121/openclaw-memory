// Binance API Price Fetcher - Node.js
// Quick fetch of current prices for research

const https = require('https');

const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

function getPrices() {
  pairs.forEach(pair => {
    https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const price = JSON.parse(data);
        console.log(`${price.symbol}: $${parseFloat(price.price).toFixed(2)}`);
      });
    });
  });
}

getPrices();