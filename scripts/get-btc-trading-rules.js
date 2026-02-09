const https = require('https');

async function getRules() {
    return new Promise((resolve, reject) => {
        https.get('https://api.binance.com/api/v3/exchangeInfo?symbol=BTCUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const symbol = result.symbols[0];
                    console.log('📊 BTCUSDT TRADING RULES (SPOT)\n');

                    symbol.filters.forEach(filter => {
                        if (filter.filterType === 'LOT_SIZE') {
                            console.log('🎯 LOT_SIZE Filter (Quantity):');
                            console.log(`   Min Qty: ${filter.minQty} BTC`);
                            console.log(`   Max Qty: ${filter.maxQty} BTC`);
                            console.log(`   Step Size: ${filter.stepSize} BTC`);
                            console.log(`💡 Must be multiples of 0.00001`);

                        } else if (filter.filterType === 'MIN_NOTIONAL') {
                            const minNotional = parseFloat(filter.minNotional);
                            console.log('\n💰 MIN_NOTIONAL Filter (Order Value):');
                            console.log(`   Min Order Value: $${minNotional}`);
                            console.log(`💡 Order must be worth at least $5`);
                        }
                    });

                    console.log('\n✅ QUICK CALCULATION:');
                    const price = 68415;
                    const minQty = 0.00001;
                    const minNotional = 5;
                    const qtyForNotional = minNotional / price;

                    console.log(`   Price: $${price}`);
                    console.log(`   Min Qty: ${minQty} BTC = $${(minQty * price).toFixed(2)} (TOO SMALL)`);
                    console.log(`   For $5 minimum: ${qtyForNotional.toFixed(6)} BTC needed`);

                    const recommendedQty = Math.ceil(qtyForNotional / 0.00001) * 0.00001;
                    console.log(`   ✅ Recommended: ${recommendedQty} BTC = $${(recommendedQty * price).toFixed(2)}`);

                    process.exit(0);
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

getRules().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});