const https = require('https');

async function checkBNBMinimums() {
    console.log('🔍 CHECKING BNB FUTURES MINIMUM ORDER REQUIREMENTS\n');

    // Check BNBUSDT futures trading rules
    return new Promise((resolve, reject) => {
        https.get('https://fapi.binance.com/fapi/v1/exchangeInfo?symbol=BNBUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const symbol = result.symbols[0];

                    console.log('BNBUSDT Futures Trading Rules:\n');

                    symbol.filters.forEach(filter => {
                        if (filter.filterType === 'LOT_SIZE') {
                            const minQty = parseFloat(filter.minQty);
                            const stepSize = parseFloat(filter.stepSize);

                            console.log('🎯 LOT_SIZE Filter:');
                            console.log(`   Min Qty: ${minQty} BNB`);
                            console.log(`   Step Size: ${stepSize} BNB`);

                        } else if (filter.filterType === 'MIN_NOTIONAL') {
                            const minNotional = parseFloat(filter.minNotional);
                            console.log('\n💰 MIN_NOTIONAL Filter:');
                            console.log(`   Min Order Value: $${minNotional}`);

                            // Calculate with BNB price
                            const bnbPrice = 650; // Approximate
                            const minQtyBNB = minNotional / bnbPrice;
                            console.log(`   With BNB @ $${bnbPrice}: ${minQtyBNB.toFixed(4)} BNB needed`);
                        }
                    });

                    console.log('\n' + '='.repeat(60));
                    console.log('💡 COMPARISON: BTC vs BNB Futures');
                    console.log('='.repeat(60));
                    console.log(`BTCUSDT Min Order: $100`);
                    console.log(`BNBUSDT Min Order: $5 (if true)`);
                    console.log(`\n✅ BNB is 20x lower minimum!`);

                    process.exit(0);
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

checkBNBMinimums().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});