// Check and sell ETH position
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

async function checkAndSell() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 CHECKING AND SELLING ETH POSITION');
    console.log('='.repeat(70) + '\n');

    // Get account to see current balances
    const account = await signedRequest('GET', '/api/v3/account');
    const eth = parseFloat(account.balances.find(b => b.asset === 'ETH').free);
    const usdt = parseFloat(account.balances.find(b => b.asset === 'USDT').free);

    console.log('💼 Current Balances:');
    console.log(`   ETH: ${eth.toFixed(6)}`);
    console.log(`   USDT: $${usdt.toFixed(2)}`);
    console.log('');

    if (eth > 0.0001) {
        console.log('🎯 Selling ETH position...\n');

        try {
            const order = await signedRequest('POST', '/api/v3/order', {
                symbol: 'ETHUSDT',
                side: 'SELL',
                type: 'MARKET',
                quantity: eth.toFixed(6)
            });

            const soldValue = parseFloat(order.cummulativeQuoteQty);
            const invested = 5.20;
            const pl = soldValue - invested;
            const plPercent = (pl / invested) * 100;

            const icon = pl >= 0 ? '🟢' : '🔴';

            console.log('⚡ SELL ORDER PLACED:');
            console.log(`   Order ID: ${order.orderId}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Quantity: ${order.executedQty} ETH`);
            console.log(`   Value: $${soldValue.toFixed(2)}\n`);

            console.log('💵 PROFIT / LOSS:');
            console.log(`   ${icon} P/L: $${pl.toFixed(2)} (${plPercent.toFixed(2)}%)\n`);

        } catch (error) {
            console.error('❌ Sell Failed:', error.message);
            console.log('\nPossible issues:');
            console.log('   - Order size below minimum (lot size filter)');
            console.log('   - Price precision issue');
            console.log('   - Balance locked in pending order');

            // Try with slightly less quantity due to lot size
            const adjustedQty = Math.floor(eth * 1e6) / 1e6;
            console.log(`\nTrying with adjusted quantity: ${adjustedQty}...`);

            try {
                const order2 = await signedRequest('POST', '/api/v3/order', {
                    symbol: 'ETHUSDT',
                    side: 'SELL',
                    type: 'MARKET',
                    quantity: adjustedQty
                });
                console.log('✅ Second attempt successful!');
                console.log(`   Order ID: ${order2.orderId}`);
                console.log(`   Value: $${parseFloat(order2.cummulativeQuoteQty).toFixed(2)}`);
            } catch (error2) {
                console.error('❌ Second attempt also failed:', error2.message);
            }
        }
    } else {
        console.log('✅ No ETH position to sell');
    }

    // Get final balances
    const account2 = await signedRequest('GET', '/api/v3/account');
    const eth2 = parseFloat(account2.balances.find(b => b.asset === 'ETH').free);
    const usdt2 = parseFloat(account2.balances.find(b => b.asset === 'USDT').free);

    console.log('\n' + '='.repeat(70));
    console.log('💼 UPDATED BALANCES');
    console.log('='.repeat(70));
    console.log(`   ETH: ${eth2.toFixed(6)}`);
    console.log(`   USDT: $${usdt2.toFixed(2)}`);
    console.log('');
    console.log('🚀 READY FOR TRIANGULAR ARBITRAGE!');
    console.log('='.repeat(70) + '\n');

    return { eth: eth2, usdt: usdt2 };
}

checkAndSell().catch(console.error);