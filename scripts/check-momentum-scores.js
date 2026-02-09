const https = require('https');

const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

console.log('\n═════════════════════════════════════════════════════');
console.log('📈 MOMENTUM SCORE DIAGNOSTIC');
console.log('═════════════════════════════════════════════════════\n');

async function getTicker(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Symbol      | Price Change % | Momentum Score | Trade?');
    console.log('─────────────┼────────────────┼────────────────┼────────\n');

    for (const symbol of pairs) {
        try {
            const ticker = await getTicker(symbol);
            const priceChangePercent = parseFloat(ticker.priceChangePercent);

            let score = 0;
            if (priceChangePercent > 0 && priceChangePercent < 2) {
                score = priceChangePercent;
            }
            if (priceChangePercent > 10) score -= 100;

            const shouldTrade = score > 0;

            console.log(`${symbol.padEnd(12)} | ${(priceChangePercent > 0 ? '+' : '') + priceChangePercent.toFixed(2).padEnd(14)} | ${score.toFixed(2).padEnd(14)} | ${shouldTrade ? 'YES ✅' : 'NO ⏳'}`);
        } catch (err) {
            console.error(`${symbol.padEnd(12)} | ERROR: ${err.message}`);
        }
    }

    console.log('\n═════════════════════════════════════════════════════\n');
}

main();