const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

console.log('\n============================================================');
console.log('🔍 BNB FUTURES MARKET PRICE CHECK');
console.log('============================================================\n');

// Check current BNB price
https.get('https://fapi.binance.com/fapi/v1/ticker/price?symbol=BNBUSDT', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log(`Current BNB Futures Price: $${result.price}\n`);
            console.log('Position Entry Price: $648.57');
            console.log(`Difference: $${(result.price - 648.57).toFixed(2)}`);
            console.log('');
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
        process.exit(0);
    });
}).on('error', err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});