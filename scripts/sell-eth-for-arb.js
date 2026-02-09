// Sell ETH position for triangular arbitrage
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

const ENTRY_PRICE = 1925.00;
const INVESTED = 5.20;

async function signedRequest(method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'api.binance.com',
            path: `${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) { reject(err); }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function getPrice(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        });
    });
}

async function sellEthPosition() {
    console.log('\n' + '='.repeat(70));
    console.log('💰 SELLING ETH POSITION FOR TRIANGULAR ARBITRAGE');
    console.log('='.repeat(70) + '\n');

    // Get account balance
    const account = await signedRequest('GET', '/api/v3/account');
    const ethBalance = parseFloat(account.balances.find(b => b.asset === 'ETH').free);

    if (ethBalance === 0) {
        console.log('❌ No ETH balance to sell\n');
        return;
    }

    console.log(`ETH Balance: ${ethBalance.toFixed(6)} ETH`);
    console.log(`Estimated Value: $${(ethBalance * ENTRY_PRICE).toFixed(2)}\n`);

    // Get current price
    const priceData = await getPrice('ETHUSDT');
    const currentPrice = parseFloat(priceData.price);
    console.log(`Current ETH Price: $${currentPrice.toFixed(2)}\n`);

    // Place market sell order
    const order = await signedRequest('POST', '/api/v3/order', {
        symbol: 'ETHUSDT',
        side: 'SELL',
        type: 'MARKET',
        quantity: ethBalance.toFixed(7)
    });

    console.log('⚡ SELL ORDER PLACED:');
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Quantity: ${order.executedQty} ETH`);
    console.log(`   Value: $${parseFloat(order.cummulativeQuoteQty).toFixed(2)}\n`);

    // Calculate profit/loss
    const soldFor = parseFloat(order.cummulativeQuoteQty);
    const pl = soldFor - INVESTED;
    const plPercent = (pl / INVESTED) * 100;

    const icon = pl >= 0 ? '🟢' : '🔴';
    console.log('💵 PROFIT / LOSS:');
    console.log(`   ${icon} P/L: $${pl.toFixed(2)} (${plPercent.toFixed(2)}%)\n`);

    // Get updated balance
    const account2 = await signedRequest('GET', '/api/v3/account');
    const usdt = parseFloat(account2.balances.find(b => b.asset === 'USDT').free);

    console.log('✅ NEW BALANCE:');
    console.log(`   💵 USDT Available: $${usdt.toFixed(2)}`);
    console.log('');
    console.log('='.repeat(70));
    console.log('🚀 READY FOR TRIANGULAR ARBITRAGE');
    console.log('='.repeat(70));
    console.log(`   Capital: $${usdt.toFixed(2)}`);
    console.log(`   All funds available for arbitrage!`);
    console.log('='.repeat(70) + '\n');

    return { soldFor, pl, usdt };
}

sellEthPosition().catch(console.error);