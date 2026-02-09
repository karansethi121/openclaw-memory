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

async function main() {
    console.log('📊 CHECKING REAL ACCOUNT ACTIVITY\n');
    
    try {
        // Get account
        const account = await signedRequest('GET', '/api/v3/account');
        
        console.log('💰 Current Balance:');
        const usdt = account.balances.find(b => b.asset === 'USDT');
        const sol = account.balances.find(b => b.asset === 'SOL');
        const eth = account.balances.find(b => b.asset === 'ETH');
        const btc = account.balances.find(b => b.asset === 'BTC');
        
        console.log(`   USDT: ${parseFloat(usdt.free).toFixed(2)} (locked: ${parseFloat(usdt.locked).toFixed(2)})`);
        console.log(`   SOL:  ${parseFloat(sol.free).toFixed(4)} (locked: ${parseFloat(sol.locked).toFixed(4)})`);
        console.log(`   ETH:  ${parseFloat(eth.free).toFixed(4)} (locked: ${parseFloat(eth.locked).toFixed(4)})`);
        console.log(`   BTC:  ${parseFloat(btc.free).toFixed(6)} (locked: ${parseFloat(btc.locked).toFixed(6)})`);
        
        // Get recent trades
        const trades = await signedRequest('GET', '/api/v3/myTrades', { symbol: 'SOLUSDT', limit: '10' });
        const today = Date.now() - (24 * 60 * 60 * 1000);
        const recentTrades = trades.filter(t => t.time > today);
        
        console.log('\n📈 Recent Trades (Last 24 hours):');
        if (recentTrades.length === 0) {
            console.log('   ❌ NO TRADES TODAY');
        } else {
            recentTrades.forEach(t => {
                const time = new Date(t.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
                const type = t.isBuyer ? 'BUY 🟢' : 'SELL 🔴';
                console.log(`   ${time} | ${type} | ${t.price} | ${t.qty} SOL`);
            });
        }
        
        // Get recent orders
        const orders = await signedRequest('GET', '/api/v3/myTrades', { symbol: 'ETHUSDT', limit: '5' });
        const recentETHOrders = orders.filter(t => t.time > today);
        
        if (recentETHOrders.length > 0) {
            console.log('\n📈 ETH Trades:');
            recentETHOrders.forEach(t => {
                const time = new Date(t.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
                const type = t.isBuyer ? 'BUY 🟢' : 'SELL 🔴';
                console.log(`   ${time} | ${type} | ${t.price} | ${t.qty} ETH`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();