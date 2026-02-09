// Sell ETH with correct lot size
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

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
                    const parsed = JSON.parse(data);
                    if (parsed.code) {
                        reject(new Error(`Binance Error ${parsed.code}: ${parsed.msg}`));
                    } else {
                        resolve(parsed);
                    }
                } catch (err) { reject(err); }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function sellEthCorrectly() {
    console.log('\n' + '='.repeat(70));
    console.log('💰 SELLING ETH - CORRECTING LOT SIZE');
    console.log('='.repeat(70) + '\n');

    // Get current balance
    const account = await signedRequest('GET', '/api/v3/account');
    const ethBalance = parseFloat(account.balances.find(b => b.asset === 'ETH').free);

    console.log(`ETH Balance: ${ethBalance.toFixed(6)}\n`);

    // LOT_SIZE filter requirements for ETHUSDT:
    // - Min Qty: 0.0001
    // - Step Size: 0.0001
    // - Current: 0.002697
    // - Adjusted: 0.0026 (round down to step size)

    const stepSize = 0.0001;
    const adjustedQty = Math.floor(ethBalance / stepSize) * stepSize;

    console.log(`Adjusted Qty for LOT_SIZE filter: ${adjustedQty.toFixed(4)} ETH`);

    if (adjustedQty < 0.0001) {
        console.log('❌ Quantity too small (below minimum 0.0001)');
        console.log('Keeping ETH position for now\n');
        return;
    }

    console.log(`Attempting to sell ${adjustedQty} ETH...\n`);

    try {
        const order = await signedRequest('POST', '/api/v3/order', {
            symbol: 'ETHUSDT',
            side: 'SELL',
            type: 'MARKET',
            quantity: adjustedQty.toFixed(4)
        });

        const soldValue = parseFloat(order.cummulativeQuoteQty);
        const invested = 5.20;
        const pl = soldValue - invested;
        const plPercent = (pl / invested) * 100;

        const icon = pl >= 0 ? '🟢' : '🔴';

        console.log('⚡ SELL ORDER SUCCESS!');
        console.log(`   Order ID: ${order.orderId}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Sold: ${order.executedQty} ETH`);
        console.log(`   Value: $${soldValue.toFixed(2)}\n`);

        console.log('💵 PROFIT / LOSS:');
        console.log(`   ${icon} P/L: $${pl.toFixed(2)} (${plPercent.toFixed(2)}%)\n`);

    } catch (error) {
        console.error('❌ Sell failed:', error.message);
        console.log('\n💡 Alternative: Keep ETH position for now');
        console.log('   Position is small, can also use USDT for triangular arb');
    }

    // Get final balances
    const account2 = await signedRequest('GET', '/api/v3/account');
    const ethFinal = parseFloat(account2.balances.find(b => b.asset === 'ETH').free);
    const usdtFinal = parseFloat(account2.balances.find(b => b.asset === 'USDT').free);

    console.log('\n' + '='.repeat(70));
    console.log('💼 FINAL BALANCES');
    console.log('='.repeat(70));
    console.log(`   ETH: ${ethFinal.toFixed(6)}`);
    console.log(`   USDT: $${usdtFinal.toFixed(2)}`);
    console.log('='.repeat(70) + '\n');
}

sellEthCorrectly().catch(console.error);