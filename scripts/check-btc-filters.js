const https = require('https');

async function getSymbolInfo() {
    return new Promise((resolve, reject) => {
        https.get('https://api.binance.com/api/v3/exchangeInfo?symbol=BTCUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.symbols && result.symbols.length > 0) {
                        const symbol = result.symbols[0];
                        console.log('📊 BTCUSDT Trading Rules\n');
                        console.log('Filters:');
                        symbol.filters.forEach(filter => {
                            if (filter.filterType === 'LOT_SIZE') {
                                console.log(`\n🎯 LOT_SIZE Filter (Quantity):`);
                                console.log(`   Min Qty: ${filter.minQty}`);
                                console.log(`   Max Qty: ${filter.maxQty}`);
                                console.log(`   Step Size: ${filter.stepSize}`);
                                console.log(`   Must be multiple of: ${filter.stepSize}`);
                            } else if (filter.filterType === 'MIN_NOTIONAL') {
                                console.log(`\n💰 MIN_NOTIONAL Filter (Order Value):`);
                                console.log(`   Min Order Value: ${filter.minNotional} USDT`);
                            }
                        });
                        resolve(symbol.filters);
                    }
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

getSymbolInfo()
    .then(filters => {
        console.log('\n✅ Rules captured');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });