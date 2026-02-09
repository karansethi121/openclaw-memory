const https = require('https');

console.log('\n============================================================');
console.log('📋 BNBUSDT SPOT vs FUTURES - CLEAR COMPARISON');
console.log('============================================================\n');

async function getSpotInfo() {
    return new Promise((resolve, reject) => {
        https.get('https://api.binance.com/api/v3/exchangeInfo?symbol=BNBUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getFuturesInfo() {
    return new Promise((resolve, reject) => {
        https.get('https://fapi.binance.com/fapi/v1/exchangeInfo?symbol=BNBUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function getBNBPrice() {
    return new Promise((resolve, reject) => {
        https.get('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function compare() {
    try {
        const [spotInfo, futuresInfo, ticker] = await Promise.all([
            getSpotInfo(),
            getFuturesInfo(),
            getBNBPrice()
        ]);

        const price = parseFloat(ticker.price);
        console.log(`BNB Current Price: $${price.toFixed(2)}\n`);

        // SPOT
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 SPOT TRADING');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const spotNotional = spotInfo.symbols[0].filters.find(f => f.filterType === 'NOTIONAL');
        const spotLotSize = spotInfo.symbols[0].filters.find(f => f.filterType === 'LOT_SIZE');

        console.log(`NOTIONAL Filter: minNotional = ${spotNotional.minNotional} USDT`);
        console.log(`LOT_SIZE Filter: minQty = ${spotLotSize.minQty} BNB`);

        const spotMinNotional = parseFloat(spotNotional.minNotional);
        const spotMinQty = parseFloat(spotLotSize.minQty);
        const spotValueByQty = spotMinQty * price;

        console.log(`\nMin value by quantity (${spotMinQty} BNB): $${spotValueByQty.toFixed(2)}`);
        console.log(`Min value by notional: $${spotMinNotional.toFixed(2)}`);
        console.log(`\n✅ SPOT MINIMUM ORDER: $${Math.max(spotValueByQty, spotMinNotional).toFixed(2)}`);

        // FUTURES
        console.log('\n' + '='.repeat(60));
        console.log('📊 FUTURES TRADING');
        console.log('='.repeat(60) + '\n');

        const futuresMinNotional = futuresInfo.symbols[0].filters.find(f => f.filterType === 'MIN_NOTIONAL');
        const futuresLotSize = futuresInfo.symbols[0].filters.find(f => f.filterType === 'LOT_SIZE');

        console.log(`MIN_NOTIONAL Filter: notional = ${futuresMinNotional.notional} USDT`);
        console.log(`LOT_SIZE Filter: minQty = ${futuresLotSize.minQty} BNB`);

        const futuresMinNotionalValue = parseFloat(futuresMinNotional.notional);
        const futuresMinQty = parseFloat(futuresLotSize.minQty);
        const futuresValueByQty = futuresMinQty * price;

        console.log(`\nMin value by quantity (${futuresMinQty} BNB): $${futuresValueByQty.toFixed(2)}`);
        console.log(`Min value by notional: $${futuresMinNotionalValue.toFixed(2)}`);
        console.log(`\n✅ FUTURES MINIMUM ORDER: $${Math.max(futuresValueByQty, futuresMinNotionalValue).toFixed(2)}`);

        // FINAL COMPARISON
        console.log('\n' + '='.repeat(60));
        console.log('🎯 FINAL COMPARISON');
        console.log('='.repeat(60) + '\n');
        console.log(`With YOUR AMOUNT ($6.5):`);
        console.log('');
        console.log(`  SPOT Trading:`);
        if (Math.max(spotValueByQty, spotMinNotional) <= 6.5) {
            console.log(`    ✅ POSSIBLE   - Minimum: $${Math.max(spotValueByQty, spotMinNotional).toFixed(2)}`);
        } else {
            console.log(`    ❌ NEED MORE - Minimum: $${Math.max(spotValueByQty, spotMinNotional).toFixed(2)}`);
        }
        console.log('');
        console.log(`  FUTURES Trading:`);
        if (Math.max(futuresValueByQty, futuresMinNotionalValue) <= 6.5) {
            console.log(`    ✅ POSSIBLE   - Minimum: $${Math.max(futuresValueByQty, futuresMinNotionalValue).toFixed(2)}`);
        } else {
            console.log(`    ❌ NEED MORE - Minimum: $${Math.max(futuresValueByQty, futuresMinNotionalValue).toFixed(2)}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('💡 INTERPRETATION:');
        console.log('='.repeat(60) + '\n');

        if (Math.max(spotValueByQty, spotMinNotional) <= 6.5) {
            console.log('✅ $6.5 is enough for SPOT trading');
            console.log('   Your check matches SPOT requirements\n');
        }

        if (Math.max(futuresValueByQty, futuresMinNotionalValue) > 6.5) {
            console.log('❌ $6.5 is NOT enough for FUTURES trading');
            console.log('   Futures requires $100 minimum order\n');
        }

        console.log('📝 SPOT vs FUTURES:\n');
        console.log('  SPOT:');
        console.log('    - Buy crypto, sell crypto');
        console.log('    - Long only (can\'t short)');
        console.log('    - No leverage (1:1)');
        console.log('    - Minimum: $5');
        console.log('');
        console.log('  FUTURES:');
        console.log('    - Trade contracts');
        console.log('    - Can long AND short');
        console.log('    - With leverage (up to 125x)');
        console.log('    - Minimum: $100');
        console.log('    - Higher risk, higher reward\n');

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        process.exit(1);
    }
}

compare();