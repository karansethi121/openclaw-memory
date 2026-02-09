const https = require('https');

async function getBTCPositionValue() {
    return new Promise((resolve, reject) => {
        https.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const price = parseFloat(result.price);
                    const position = 0.000220; // Current BTC position
                    const value = position * price;
                    const avgBuyPrice = 66803; // Approx average from trades
                    const profit = (price - avgBuyPrice) * position;

                    console.log('📊 CURRENT BITCOIN POSITION');
                    console.log('=========================\n');
                    console.log('Position: ' + position + ' BTC');
                    console.log('Current Price: $' + price.toFixed(2));
                    console.log('Position Value: $' + value.toFixed(2));
                    console.log('Avg Entry: ~$' + avgBuyPrice.toFixed(2));
                    console.log('Unrealized P/L: $' + profit.toFixed(2) + '\n');

                    // Check if near sell signal (0.1% profit = ~$67)
                    const sellTarget = avgBuyPrice * 1.001;
                    const distance = ((price - avgBuyPrice) / avgBuyPrice) * 100;

                    console.log('🎯 Grid Trading Status:');
                    console.log('   Current: ' + distance.toFixed(3) + '% from entry');
                    console.log('   Sell Target: 0.1% ($' + sellTarget.toFixed(2) + ')');
                    console.log('   Signal: ' + (price >= sellTarget ? '✅ SELL NOW!' : '⏳ Waiting'));
                    console.log('');

                    resolve({ price, value, profit, distance, sellTarget });
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

getBTCPositionValue()
    .then(data => {
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });