const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || ';

let lotSizes = {}; // Store lot sizes for each symbol

async function getLotSize(symbol) {
    if (lotSizes[symbol]) return lotSizes[symbol];

    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/exchangeInfo?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const symbolInfo = result.symbols[0];
                    const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
                    const stepSize = parseFloat(lotSizeFilter.stepSize);
                    lotSizes[symbol] = stepSize;
                    resolve(stepSize);
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

function roundToStepSize(quantity, stepSize) {
    const decimals = (Math.log10(1 / stepSize));
    return Math.floor(quantity / stepSize) * stepSize;
}

async function sellOrder(symbol, quantity) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ 
            symbol: symbol,
            side: 'SELL',
            type: 'MARKET',
            quantity: quantity.toFixed(8),
            timestamp: timestamp.toString()
        }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'api.binance.com',
            path: `/api/v3/order?${queryString}&signature=${signature}`,
            method: 'POST',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
                    reject(new Error('HTML response'));
                } else {
                    try {
                        const result = JSON.parse(data);
                        if (result.code && result.code !== 200) {
                            reject(new Error(`${result.code}: ${result.msg}`));
                        } else {
                            resolve(result);
                        }
                    } catch (err) { reject(err); }
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function getSpotAccount() {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'api.binance.com',
            path: `/api/v3/account?${queryString}&signature=${signature}`,
            method: 'GET',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (err) { reject(err); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function sellAll() {
    console.log('\n============================================================');
    console.log('🔴 SELLING ALL SPOT POSITIONS');
    console.log('============================================================\n');

    try {
        const account = await getSpotAccount();

        console.log('📊 Finding coins to sell...\n');

        let totalUSDT = 0;
        let itemsToSell = [];

        for (const balance of account.balances) {
            const free = parseFloat(balance.free);

            if (free > 0 && balance.asset !== 'USDT') {
                const symbol = `${balance.asset}USDT`;
                itemsToSell.push({ asset: balance.asset, symbol, quantity: free });
            }
        }

        console.log(`Found ${itemsToSell.length} coins to sell\n`);

        for (const item of itemsToSell) {
            try {
                console.log(`${item.asset}: ${item.quantity.toFixed(6)}`);

                // Get lot size
                const stepSize = await getLotSize(item.symbol);
                const adjustedQty = roundToStepSize(item.quantity, stepSize);

                if (adjustedQty <= 0) {
                    console.log(`   ⏭️  Too small to sell (min lot: ${stepSize})\n`);
                    continue;
                }

                console.log(`   → Adjusted to: ${adjustedQty.toFixed(6)}`);
                console.log(`   🔄 Selling...`);

                const result = await sellOrder(item.symbol, adjustedQty);
                const usdtReceived = parseFloat(result.cummulativeQuoteQty);
                totalUSDT += usdtReceived;

                const price = usdtReceived / adjustedQty;
                console.log(`   ✅ Sold ${result.executedQty} ${item.asset} @ $${price.toFixed(2)}`);
                console.log(`   💰 Received: +$${usdtReceived.toFixed(2)} USDT\n`);

            } catch (err) {
                console.log(`   ❌ ${item.asset}: ${err.message}\n`);
            }
        }

        console.log('Step 2: Checking final USDT balance...\n');
        await new Promise(r => setTimeout(r, 1000));

        const newAccount = await getSpotAccount();
        const usdtBalance = parseFloat(newAccount.balances.find(b => b.asset === 'USDT').free);

        console.log(`📊 Final USDT Balance: $${usdtBalance.toFixed(2)}`);
        console.log(`💰 Total received from sales: $${totalUSDT.toFixed(2)}\n`);

        if (usdtBalance >= 5) {
            console.log(`✅ Can now trade! (Minimum $5 met)\n`);
        } else {
            console.log(`⚠️ Still below $5 minimum\n`);
        }

        console.log('≡'.repeat(60));

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
    }
}

sellAll();