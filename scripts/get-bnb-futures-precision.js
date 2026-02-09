const https = require('https');

async function getBNBFuturesPrecision() {
    return new Promise((resolve, reject) => {
        https.get('https://fapi.binance.com/fapi/v1/exchangeInfo?symbol=BNBUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const symbol = result.symbols[0];

                    console.log('📊 BNBUSDT Futures Precision Rules\n');

                    symbol.filters.forEach(filter => {
                        if (filter.filterType === 'LOT_SIZE') {
                            console.log('LOT_SIZE:');
                            console.log(`  minQty: ${filter.minQty}`);
                            console.log(`  maxQty: ${filter.maxQty}`);
                            console.log(`  stepSize: ${filter.stepSize}`);
                        } else if (filter.filterType === 'PRICE_FILTER') {
                            console.log('\nPRICE_FILTER:');
                            console.log(`  minPrice: ${filter.minPrice}`);
                            console.log(`  maxPrice: ${filter.maxPrice}`);
                            console.log(`  tickSize: ${filter.tickSize}`);
                        } else if (filter.filterType === 'MARKET_LOT_SIZE') {
                            console.log('\nMARKET_LOT_SIZE (Market Orders):');
                            console.log(`  minQty: ${filter.minQty}`);
                            console.log(`  maxQty: ${filter.maxQty}`);
                            console.log(`  stepSize: ${filter.stepSize}`);
                        }
                    });

                    const marketLot = symbol.filters.find(f => f.filterType === 'MARKET_LOT_SIZE');
                    console.log('\n💡 Market Order Rules:');
                    console.log(`  Must be multiples of: ${marketLot.stepSize}`);
                    console.log(`  Minimum: ${marketLot.minQty}`);
                    console.log(`  Example allowed: 0.001, 0.002, 0.003, etc.\n`);

                    const price = 650;
                    const minQty = parseFloat(marketLot.minQty);
                    const minValue = minQty * price;
                    console.log(`With BNB @ $${price}:`);
                    console.log(`  Min qty (${minQty}) = $${minValue.toFixed(2)}`);

                    process.exit(0);
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

getBNBFuturesPrecision().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});