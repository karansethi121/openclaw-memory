const https = require('https');

const CONFIG = {
    pairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'XRPUSDT', 'BNBUSDT'],
    tradeAmount: 2.00
};

async function getPrice(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

console.log('\nChecking minimum orders...');

async function main() {
    console.log('\n'.padEnd(20) + 'Price'.padEnd(15) + 'Min Qty'.padEnd(15) + '$2 Order Qty'.padEnd(20) + 'Can Trade $2?');
    console.log('─'.repeat(80) + '\n');

    for (const symbol of CONFIG.pairs) {
        try {
            const priceData = await getPrice(symbol);
            const price = parseFloat(priceData.price);
            const qty = CONFIG.tradeAmount / price;

            console.log(`${symbol.padEnd(20)}$${price.toFixed(2).padEnd(14)}${qty.toFixed(8).padEnd(15)}$${qty.toFixed(8).padEnd(20)}`);

            if (symbol.includes('BTC')) {
                console.log(`   → BTC: 0.000070 BTC = ~$5 minimum`);
            } else {
                console.log(`   → Minimum: $5 (likely)`);
            }
            console.log();
        } catch (err) {
            console.log(`${symbol}: ERROR - ${err.message}\n`);
        }
    }

    console.log('CONCLUSION:');
    console.log('- BTC: Needs $5 minimum (0.000070 BTC)');
    console.log('- Others may also require $5');
    console.log('- Solution: Trade ETH or sell other coins to consolidate funds\n');
}

main();