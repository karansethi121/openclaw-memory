const https = require('https');

async function getPublicRequest(path) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

console.log('\n============================================================');
console.log('📋 BNBUSDT SPOT vs FUTURES COMPARISON');
console.log('============================================================\n');

async function compareBNB() {
    try {
        // Get BNB Spot Exchange Info
        console.log('📊 BNBUSDT SPOT Exchange Info:\n');
        const spotInfo = await getPublicRequest('/v3/exchangeInfo?symbol=BNBUSDT');
        const spotSymbol = spotInfo.symbols[0];

        const spotMinNotional = spotSymbol.filters.find(f => f.filterType === 'MIN_NOTIONAL');
        const spotLotSize = spotSymbol.filters.find(f => f.filterType === 'LOT_SIZE');
        const spotPriceFilter = spotSymbol.filters.find(f => f.filterType === 'PRICE_FILTER');

        console.log(`MIN_NOTIONAL: ${spotMinNotional.notional} USDT`);
        console.log(`Min Quantity: ${spotLotSize.minQty} BNB`);
        console.log(`Step Size: ${spotLotSize.stepSize} BNB`);

        // Get BNB price
        const ticker = await getPublicRequest('/v3/ticker/price?symbol=BNBUSDT');
        const price = parseFloat(ticker.price);
        console.log(`\nCurrent Price: $${price.toFixed(2)}`);

        // Calculate spot minimum order
        const spotMinQty = parseFloat(spotLotSize.minQty);
        const spotMinValue = spotMinQty * price;
        const spotMinNotionalValue = parseFloat(spotMinNotional.notional);

        console.log(`\nMinimum by Quantity (${spotMinQty} BNB): $${spotMinValue.toFixed(2)}`);
        console.log(`Minimum by Notional ($${spotMinNotionalValue}): $${spotMinNotionalValue.toFixed(2)}`);

        const actualSpotMin = Math.max(spotMinValue, spotMinNotionalValue);
        console.log(`\n✅ SPOT MINIMUM ORDER: $${actualSpotMin.toFixed(2)}`);

        console.log('\n' + '='.repeat(60) + '\n');

        // Get BNB Futures Exchange Info
        console.log('📊 BNBUSDT FUTURES Exchange Info:\n');
        const futuresInfo = await getPublicRequest('https://fapi.binance.com/fapi/v1/exchangeInfo?symbol=BNBUSDT');
        const futuresSymbol = futuresInfo.symbols[0];

        const futuresMinNotional = futuresSymbol.filters.find(f => f.filterType === 'MIN_NOTIONAL');
        const futuresLotSize = futuresSymbol.filters.find(f => f.filterType === 'LOT_SIZE');

        console.log(`MIN_NOTIONAL: ${futuresMinNotional.notional} USDT`);
        console.log(`Min Quantity: ${futuresLotSize.minQty} BNB`);
        console.log(`Step Size: ${futuresLotSize.stepSize} BNB`);

        // Calculate futures minimum order
        const futuresMinQty = parseFloat(futuresLotSize.minQty);
        const futuresMinValue = futuresMinQty * price;
        const futuresMinNotionalValue = parseFloat(futuresMinNotional.notional);

        console.log(`\nMinimum by Quantity (${futuresMinQty} BNB): $${futuresMinValue.toFixed(2)}`);
        console.log(`Minimum by Notional ($${futuresMinNotionalValue}): $${futuresMinNotionalValue.toFixed(2)}`);

        const actualFuturesMin = Math.max(futuresMinValue, futuresMinNotionalValue);
        console.log(`\n✅ FUTURES MINIMUM ORDER: $${actualFuturesMin.toFixed(2)}`);

        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPARISON:\n');
        console.log(`SPOT Minimum:   $${actualSpotMin.toFixed(2)}  ✅`);
        console.log(`FUTURES Minimum: $${actualFuturesMin.toFixed(2)}  ❌`);
        console.log('\n');

        // Check accounts
        console.log('Checking account balances...\n');
        console.log('Note: Need valid API keys to check actual balances\n');

        console.log('💡 SUMMARY:\n');
        console.log(`With $6.5 balance:`);
        if (actualSpotMin <= 6.5) {
            console.log(`  ✅ SPOT Trading: Possible!`);
        } else {
            console.log(`  ❌ SPOT Trading: Need $${(actualSpotMin - 6.5).toFixed(2)} more`);
        }

        if (actualFuturesMin <= 6.5) {
            console.log(`  ✅ FUTURES Trading: Possible!`);
        } else {
            console.log(`  ❌ FUTURES Trading: Need $${(actualFuturesMin - 6.5).toFixed(2)} more`);
        }

        console.log('\n' + '='.repeat(60) + '\n');

    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

compareBNB();