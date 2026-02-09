const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function makeRequest(method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v1${endpoint}?${queryString}&signature=${signature}`,
            method: method,
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.code && result.code !== 200) {
                        reject(new Error(`${result.code}: ${result.msg}`));
                    } else {
                        resolve(result);
                    }
                } catch (err) { reject(err); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function getPublicRequest(endpoint) {
    return new Promise((resolve, reject) => {
        https.get(`https://fapi.binance.com/fapi/v1${endpoint}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

console.log('\n============================================================');
console.log('🔴 ATTEMPT #2: CLOSE BNB FUTURES POSITION (HEDGING MODE)');
console.log('============================================================\n');

async function tryClosePosition() {
    try {
        console.log('Step 1: Getting account with position mode info...\n');
        const account = await makeRequest('GET', '/account');

        console.log(`Position Mode: ${account.multiAssetsMargin ? 'Multi-Assets' : 'Single-Asset'}`);
        console.log(`Total Balance: $${parseFloat(account.totalWalletBalance).toFixed(2)}`);
        console.log(`Available: $${parseFloat(account.availableBalance).toFixed(2)}\n`);

        console.log('Step 2: Finding BNB position details...\n');
        let bnbPosition = null;
        for (const pos of account.positions) {
            if (pos && pos.symbol === 'BNBUSDT') {
                bnbPosition = pos;
                break;
            }
        }

        if (!bnbPosition) {
            console.log('❌ BNB position not found in account positions.\n');
            process.exit(1);
        }

        console.log(`Position Details:`);
        console.log(`  Position Amount: ${bnbPosition.positionAmt}`);
        console.log(`  Entry Price: ${bnbPosition.entryPrice}`);
        console.log(`  Mark Price: ${bnbPosition.markPrice}`);
        console.log(`  Unrealized PNL: ${bnbPosition.unRealizedProfit}`);
        console.log(`  Isolated?: ${bnbdPosition.positionSide === 'BOTH' ? 'No (ONE-WAY)' : 'Yes (HEDGING)'}\n`);

        console.log('Step 3: Trying to close with positionSide parameter...\n');

        // Try 1: Without positionSide (ONE-WAY mode)
        console.log('Trying method 1: ONE-WAY mode (no positionSide)...');
        try {
            const result = await makeRequest('POST', '/order', {
                symbol: 'BNBUSDT',
                side: 'SELL',
                type: 'MARKET',
                quantity: '0.01',
                reduceOnly: 'true'
            });
            console.log('✅ SUCCESS! Order executed.');
            console.log(`Order ID: ${result.orderId}`);
            console.log(`Executed: ${result.executedQty}`);
            process.exit(0);
        } catch (err1) {
            console.log(`❌ Method 1 failed: ${err1.message}\n`);
        }

        // Try 2: With positionSide = BOTH (HEDGING mode)
        console.log('Trying method 2: HEDGING mode (positionSide=BOTH)...');
        try {
            const result = await makeRequest('POST', '/order', {
                symbol: 'BNBUSDT',
                side: 'SELL',
                type: 'MARKET',
                quantity: '0.01',
                positionSide: 'BOTH',
                reduceOnly: 'true'
            });
            console.log('✅ SUCCESS! Order executed.');
            console.log(`Order ID: ${result.orderId}`);
            console.log(`Executed: ${result.executedQty}`);
            process.exit(0);
        } catch (err2) {
            console.log(`❌ Method 2 failed: ${err2.message}\n`);
        }

        // Try 3: With positionSide = LONG (HEDGING mode specific side)
        console.log('Trying method 3: HEDGING mode (positionSide=LONG)...');
        try {
            const result = await makeRequest('POST', '/order', {
                symbol: 'BNBUSDT',
                side: 'SELL',
                type: 'MARKET',
                quantity: '0.01',
                positionSide: 'LONG',
                reduceOnly: 'true'
            });
            console.log('✅ SUCCESS! Order executed.');
            console.log(`Order ID: ${result.orderId}`);
            console.log(`Executed: ${result.executedQty}`);
            process.exit(0);
        } catch (err3) {
            console.log(`❌ Method 3 failed: ${err3.message}\n`);
        }

        console.log('============================================================');
        console.log('❌ ALL METHODS FAILED');
        console.log('============================================================\n');
        console.log('Possible reasons:');
        console.log('  1. Position is already closed (stale data)');
        console.log('  2. Position is locked/frozen');
        console.log('  3. Different parameters needed');
        console.log('  4. Account has restrictions\n');

        process.exit(1);

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
        process.exit(1);
    }
}

tryClosePosition();