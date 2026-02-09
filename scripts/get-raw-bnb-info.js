const https = require('https');

async function getRawExchangeInfo() {
    return new Promise((resolve, reject) => {
        https.get('https://fapi.binance.com/fapi/v1/exchangeInfo?symbol=BNBUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const symbol = result.symbols[0];

                    console.log('📋 RAW BNBUSDT FUTURES EXCHANGE INFO\n');

                    symbol.filters.forEach((filter, index) => {
                        console.log(`\nFilter ${index + 1}: ${filter.filterType}`);
                        console.log('  ' + JSON.stringify(filter, null, 2));
                    });

                    console.log('\n' + '='.repeat(70));
                    console.log('💡 ANALYSIS:\n');

                    // Find all numeric values that could be minimum notional
                    symbol.filters.forEach(filter => {
                        for (const key in filter) {
                            const val = parseFloat(filter[key]);
                            if (!isNaN(val) && val >= 5 && val <= 100 && key.includes('inValue')) {
                                console.log(`  ✅ Found minimum: ${key} = ${val}`);
                            }
                        }
                    });

                    console.log('\n  ⚠️  No clear MIN_NOTIONAL found in filters');
                    console.log('  💡 The 0.010 BNB order ($6.49) needs investigation');
                    console.log('  💡 Order was accepted but executed 0.00 BNB');
                    console.log('  💡 This suggests a runtime notional check\n');

                    process.exit(0);
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

getRawExchangeInfo().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});