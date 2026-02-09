const https = require('https');

async function getFuturesSymbolInfo() {
    return new Promise((resolve, reject) => {
        https.get('https://fapi.binance.com/fapi/v1/exchangeInfo?symbol=BTCUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.symbols && result.symbols.length > 0) {
                        const symbol = result.symbols[0];
                        console.log('📊 BTCUSDT Futures Trading Rules\n');
                        console.log('Filters:');
                        symbol.filters.forEach(filter => {
                            if (filter.filterType === 'LOT_SIZE') {
                                console.log(`\n🎯 LOT_SIZE Filter (Quantity):`);
                                console.log(`   Min Qty: ${filter.minQty}`);
                                console.log(`   Max Qty: ${filter.maxQty}`);
                                console.log(`   Step Size: ${filter.stepSize}`);
                            } else if (filter.filterType === 'MIN_NOTIONAL') {
                                console.log(`\n💰 MIN_NOTIONAL Filter (Order Value):`);
                                console.log(`   Min Order Value: ${filter.minNotional} USDT`);
                            } else if (filter.filterType === 'MARKET_LOT_SIZE') {
                                console.log(`\n⚡ MARKET_LOT_SIZE Filter (Market Orders):`);
                                console.log(`   Min Qty: ${filter.minQty}`);
                                console.log(`   Max Qty: ${filter.maxQty}`);
                                console.log(`   Step Size: ${filter.stepSize}`);
                            }
                        });
                        resolve(symbol.filters);
                    }
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

getFuturesSymbolInfo()
    .then(filters => {
        console.log('\n✅ Rules captured');
        
        // Calculate correct order quantity
        const stepSize = filters.find(f => f.filterType === 'MARKET_LOT_SIZE').stepSize;
        const minQty = filters.find(f => f.filterType === 'MARKET_LOT_SIZE').minQty;
        
        console.log('\n💡 For Market Orders:');
        console.log(`   Use step size: ${stepSize}`);
        console.log(`   Minimum qty: ${minQty}`);
        console.log(`   Example: 0.001, 0.002, 0.003, etc.\n`);
        
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });