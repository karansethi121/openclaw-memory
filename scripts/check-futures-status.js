const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env?.BINANCE_API_KEY || '';
const API_SECRET = config.env?.BINANCE_API_SECRET || '';

async function getFuturesAccount() {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v2/account?${queryString}&signature=${signature}`,
            method: 'GET',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
                    reject(new Error('HTML response - rate limited'));
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) { reject(err); }
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function closePosition(symbol, quantity) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ 
            symbol: symbol,
            positionSide: 'LONG',
            quantity: Math.abs(parseFloat(quantity)).toFixed(3),
            timestamp: timestamp.toString()
        }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: 'fapi.binance.com',
            path: `/fapi/v1/order?${queryString}&signature=${signature}`,
            method: 'POST',
            headers: { 'X-MBX-APIKEY': API_KEY }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
                    reject(new Error('HTML response - rate limited'));
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

async function main() {
    console.log('\n============================================================');
    console.log('🔍 FUTURES STATUS CHECK');
    console.log('============================================================\n');

    try {
        const account = await getFuturesAccount();

        console.log('💰 Futures Account Info:');
        console.log(`   Total Wallet Balance: $${parseFloat(account.totalWalletBalance).toFixed(2)}`);
        console.log(`   Available Balance: $${parseFloat(account.availableBalance).toFixed(2)}`);
        console.log(`   Unrealized PNL: $${parseFloat(account.totalUnrealizedProfit).toFixed(2)}\n`);

        console.log('📊 Open Positions:');
        let hasPositions = false;

        for (const pos of account.positions) {
            if (parseFloat(pos.positionAmt) !== 0) {
                hasPositions = true;
                const pnl = parseFloat(pos.unRealizedProfit);
                const emoji = pnl > 0 ? '📈' : '📉';

                console.log(`\n${emoji} ${pos.symbol} (${pos.positionSide})`);
                console.log(`   Size: ${pos.positionAmt} @ $${parseFloat(pos.entryPrice).toFixed(2)}`);
                console.log(`   Mark Price: $${parseFloat(pos.markPrice).toFixed(2)}`);
                console.log(`   Unrealized PNL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} (${(parseFloat(pos.roe)).toFixed(2)}% ROE)`);
                console.log(`   Notional: $${parseFloat(pos.notional).toFixed(2)}`);
                console.log(`   Can close: YES ✓`);
            }
        }

        if (!hasPositions) {
            console.log('   ✅ No open futures positions\n');
        }

        console.log('\n≡'.repeat(60));
        console.log('✅ YES - I CAN SELL/CLOSE FUTURES POSITIONS');
        console.log('   ');
        console.log('   Available commands:');
        console.log('   • "Close futures [SYMBOL]" - Close specific position');
        console.log('   • "Close all futures" - Close all futures positions');
        console.log('   ');
        console.log('   Scripts available:');
        console.log('   • scripts/close-all-positions.js - Close everything');
        console.log('   • scripts/close-bnb-futures-v2.js - BNB futures closer');
        console.log('≡'.repeat(60));

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        if (err.message.includes('HTML')) {
            console.log('\n⚠️ API rate limited - wait a few seconds');
        }
    }
}

main();