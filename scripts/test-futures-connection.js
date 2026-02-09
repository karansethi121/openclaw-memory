// Test Futures API Connection
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

async function signedRequest(hostname, method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: hostname,
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
                    if (parsed.code && parsed.code !== 200) {
                        reject(new Error(`Error ${parsed.code}: ${parsed.msg}`));
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

async function testFuturesConnection() {
    console.log('🔍 TESTING FUTURES TRADING CONNECTION');
    console.log('=========================================\n');

    try {
        // Get futures account
        const account = await signedRequest('fapi.binance.com', 'GET', '/fapi/v2/account');

        console.log('✅ Futures API Connection: SUCCESS\n');
        console.log('💰 Futures Account:');
        console.log(`   Total Wallet Balance: $${parseFloat(account.totalWalletBalance).toFixed(2)}`);
        console.log(`   Available Balance: $${parseFloat(account.availableBalance).toFixed(2)}`);
        console.log(`   Total Unrealized PNL: $${parseFloat(account.totalUnrealizedProfit).toFixed(4)}\n`);

        // Check positions
        const positions = account.positions.filter(p => parseFloat(p.positionAmt) !== 0);
        if (positions.length > 0) {
            console.log('📊 Open Positions:');
            positions.forEach(pos => {
                const side = parseFloat(pos.positionAmt) > 0 ? 'LONG' : 'SHORT';
                console.log(`   ${pos.symbol}: ${side} ${Math.abs(parseFloat(pos.positionAmt))} @ $${parseFloat(pos.entryPrice).toFixed(2)}`);
                console.log(`      Unrealized PNL: $${parseFloat(pos.unRealizedProfit).toFixed(4)}`);
            });
        } else {
            console.log('📊 No open positions');
        }

        console.log('\n✅ FUTURES TRADING: WORKING');
        return true;

    } catch (error) {
        console.error('❌ Futures API Error:', error.message);

        if (error.message.includes('API-key format invalid') || error.message.includes('Invalid API-key')) {
            console.error('\n⚠️ Futures API not configured');
            console.error('💡 Solution: Add separate futures API keys to openclaw.json\n');
            console.error('Format:');
            console.error('   BINANCE_FUTURES_API_KEY: "your_futures_key"');
            console.error('   BINANCE_FUTURES_API_SECRET: "your_futures_secret"\n');
        }

        return false;
    }
}

testFuturesConnection()
    .then(working => {
        if (working) {
            console.log('\n✅ Ready for futures trading!');
        }
        process.exit(working ? 0 : 1);
    })
    .catch(err => {
        console.error('\n❌ Test failed:', err.message);
        process.exit(1);
    });