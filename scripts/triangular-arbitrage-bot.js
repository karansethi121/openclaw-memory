// Triangular Arbitrage Bot - Binance Spot
// No loans, pure spot trading, works with any amount including $19.45

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// Read API keys from config
const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

// Trading configuration
const CONFIG = {
    minProfitPercent: 0.0035, // Minimum 0.35% gross profit (after 0.3% fees = 0.05% net)
    maxPositionPercent: 1.0,  // Use 100% of available capital
    tradesPerCycle: 5,        // Max trades per cycle
    checkInterval: 200,       // Check every 200ms (5 Hz)
    capital: 19.45,           // Current available capital
    feePerTrade: 0.001        // 0.1% per Binance trade
};

// Currency pairs to monitor
const CURRENCIES = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB'];

// Store orderbook cache
const orderbookCache = new Map();
const CACHE_TTL = 500; // 500ms cache

async function getAccount() {
    return await signedRequest('GET', '/api/v3/account');
}

async function getOrderBook(symbol) {
    const cached = orderbookCache.get(symbol);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=5`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const orderbook = JSON.parse(data);
                orderbookCache.set(symbol, { data: orderbook, timestamp: now });
                resolve(orderbook);
            });
            res.on('error', reject);
        });
    });
}

async function placeOrder(symbol, side, type, quantity, price = null) {
    const params = {
        symbol: symbol,
        side: side,
        type: type,
        quantity: quantity.toFixed(8)
    };

    if (price) {
        params.price = price.toFixed(2);
        params.timeInForce = 'GTC';
    }

    return await signedRequest('POST', '/api/v3/order', params);
}

function signedRequest(method, endpoint, params = {}) {
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
                    // Check for Binance API errors
                    if (parsed.code && parsed.code !== 200) {
                        reject(new Error(`Binance API Error ${parsed.code}: ${parsed.msg}`));
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

function generateTriangularPaths() {
    const paths = [];
    const baseCurrency = 'USDT';

    // Generate paths: USDT → A → B → USDT
    for (let i = 0; i < CURRENCIES.length; i++) {
        for (let j = 0; j < CURRENCIES.length; j++) {
            const currencyA = CURRENCIES[i];
            const currencyB = CURRENCIES[j];

            if (currencyA !== baseCurrency &&
                currencyB !== baseCurrency &&
                currencyA !== currencyB) {
                paths.push([baseCurrency, currencyA, currencyB, baseCurrency]);
            }
        }
    }

    return paths;
}

async function checkTriangularArbitrage(path, capital) {
    try {
        // Get orderbooks for all pairs in the path
        const pair1 = `${path[1]}${path[0]}`; // A/USDT
        const pair2 = `${path[2]}${path[1]}`; // B/A
        const pair3 = `${path[0]}${path[2]}`; // USDT/B

        const [ob1, ob2, ob3] = await Promise.all([
            getOrderBook(pair1),
            getOrderBook(pair2),
            getOrderBook(pair3)
        ]);

        // Check if orderbooks have data
        if (!ob1.asks || ob1.asks.length === 0 ||
            !ob2.asks || ob2.asks.length === 0 ||
            !ob3.bids || ob3.bids.length === 0) {
            return null;
        }

        // Get best prices (ask to buy, bid to sell)
        const price1 = parseFloat(ob1.asks[0][0]); // Buy A with USDT
        const price2 = parseFloat(ob2.asks[0][0]); // Buy B with A
        const price3 = parseFloat(ob3.bids[0][0]); // Sell B for USDT

        // Check liquidity
        const liquidity1 = parseFloat(ob1.asks[0][1]);
        const liquidity2 = parseFloat(ob2.asks[0][1]);
        const liquidity3 = parseFloat(ob3.bids[0][1]);

        const minLiquidity = Math.min(liquidity1 * price1, liquidity2, liquidity3);
        const maxCapital = Math.min(capital, minLiquidity);

        if (maxCapital < 5) {
            return null; // Minimum $5 to match lot size filter
        }

        // Calculate arbitrage
        const startAmount = maxCapital;
        const amount1 = startAmount / price1; // Buy A
        const amount2 = amount1 / price2; // Buy B with A
        const finalAmount = amount2 * price3; // Convert B back to USDT

        const grossProfit = finalAmount - startAmount;
        const grossProfitPercent = grossProfit / startAmount;
        const fees = startAmount * CONFIG.feePerTrade * 3; // 3 trades
        const netProfit = grossProfit - fees;
        const netProfitPercent = netProfit / startAmount;

        if (netProfitPercent >= CONFIG.minProfitPercent) {
            return {
                path: path.join(' → '),
                pathArray: path,
                grossProfit,
                grossProfitPercent: grossProfitPercent * 100,
                netProfit,
                netProfitPercent: netProfitPercent * 100,
                capitalUsed: startAmount,
                prices: { [pair1]: price1, [pair2]: price2, [pair3]: price3 },
                fees,
                trades: [
                    { pair: pair1, action: 'BUY', amount: amount1, price: price1 },
                    { pair: pair2, action: 'BUY', amount: amount2, price: price2 },
                    { pair: pair3, action: 'SELL', amount: amount2, price: price3 }
                ]
            };
        }
    } catch (error) {
        // Silent fail on individual paths
    }

    return null;
}

async function detectAllArbitrageOpportunities(capital) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 SCANNING FOR TRIANGULAR ARBITRAGE OPPORTUNITIES');
    console.log('='.repeat(80) + '\n');

    const paths = generateTriangularPaths();
    console.log(`Checking ${paths.length} triangular paths...\n`);

    const opportunities = [];

    for (const path of paths) {
        const opportunity = await checkTriangularArbitrage(path, capital);
        if (opportunity) {
            opportunities.push(opportunity);
        }
    }

    if (opportunities.length === 0) {
        console.log('❌ No profitable opportunities found (above 0.35% threshold)\n');
        return [];
    }

    console.log(`✅ Found ${opportunities.length} profitable opportunity(ies):\n`);

    opportunities.sort((a, b) => b.netProfit - a.netProfit);

    opportunities.forEach((opp, i) => {
        console.log(`${i + 1}. ${opp.path}`);
        console.log(`   Gross: $${opp.grossProfit.toFixed(4)} (${opp.grossProfitPercent.toFixed(4)}%)`);
        console.log(`   Fees: -$${opp.fees.toFixed(4)} (3 × 0.1%)`);
        console.log(`   Net Profit: $${opp.netProfit.toFixed(4)} (${opp.netProfitPercent.toFixed(4)}%)`);
        console.log(`   Capital Used: $${opp.capitalUsed.toFixed(2)}`);
        console.log('');
    });

    console.log('='.repeat(80) + '\n');

    return opportunities.slice(0, CONFIG.tradesPerCycle);
}

async function executeArbitrage(opportunity) {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ EXECUTING ARBITRAGE TRADE');
    console.log('='.repeat(80) + '\n');

    const path = opportunity.pathArray;
    const trades = opportunity.trades;

    try {
        console.log(`Path: ${opportunity.path}`);
        console.log(`Expected Profit: $${opportunity.netProfit.toFixed(4)}\n`);

        // Trade 1: Buy base crypto with USDT
        console.log(`Trade 1: BUY ${trades[0].amount.toFixed(6)} ${path[1]} with $${opportunity.capitalUsed.toFixed(2)}`);
        const order1 = await placeOrder(
            trades[0].pair,
            'BUY',
            'MARKET',
            trades[0].amount
        );
        console.log(`   Order ID: ${order1.orderId}`);
        console.log(`   Status: ${order1.status}`);
        console.log(`   Filled: ${parseFloat(order1.cummulativeQuoteQty).toFixed(2)} USDT\n`);

        // Trade 2: Buy second crypto with first crypto
        console.log(`Trade 2: BUY ${trades[1].amount.toFixed(6)} ${path[2]} with ${trades[0].amount.toFixed(6)} ${path[1]}`);
        const order2 = await placeOrder(
            trades[1].pair,
            'BUY',
            'MARKET',
            trades[1].amount
        );
        console.log(`   Order ID: ${order2.orderId}`);
        console.log(`   Status: ${order2.status}\n`);

        // Trade 3: Sell second crypto for USDT
        console.log(`Trade 3: SELL ${trades[2].amount.toFixed(6)} ${path[2]} for USDT`);
        const order3 = await placeOrder(
            trades[2].pair,
            'SELL',
            'MARKET',
            trades[2].amount
        );
        console.log(`   Order ID: ${order3.orderId}`);
        console.log(`   Status: ${order3.status}\n`);

        const finalUSDT = parseFloat(order3.cummulativeQuoteQty);
        const actualProfit = finalUSDT - opportunity.capitalUsed;

        console.log('='.repeat(80));
        console.log('✅ ARBITRAGE COMPLETE');
        console.log('='.repeat(80));
        console.log(`Started: $${opportunity.capitalUsed.toFixed(2)}`);
        console.log(`Ended: $${finalUSDT.toFixed(2)}`);
        console.log(`Profit: $${actualProfit.toFixed(4)} (${(actualProfit / opportunity.capitalUsed * 100).toFixed(4)}%)\n`);

        return {
            success: true,
            profit: actualProfit,
            orders: [order1, order2, order3]
        };
    } catch (error) {
        console.error('❌ Arbitrage failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function triangularArbitrageCycle() {
    try {
        // Get current account balance
        const account = await getAccount();
        
        // Validate account response
        if (!account || !account.balances || !Array.isArray(account.balances)) {
            throw new Error('Invalid account response from API');
        }
        
        const usdtBalanceObj = account.balances.find(b => b.asset === 'USDT');
        if (!usdtBalanceObj) {
            throw new Error('USDT balance not found');
        }
        
        const usdtBalance = parseFloat(usdtBalanceObj.free);

        console.log('\n' + '🎯'.repeat(40));
        console.log('🎯 TRIANGULAR ARBITRAGE BOT - BINARY MODE');
        console.log('🎯'.repeat(40));
        console.log(`\nCurrent USDT Balance: $${usdtBalance.toFixed(2)}\n`);

        // Check for opportunities
        const opportunities = await detectAllArbitrageOpportunities(usdtBalance);

        if (opportunities.length > 0) {
            console.log('🚀 EXECUTING BEST OPPORTUNITY...\n');
            const result = await executeArbitrage(opportunities[0]);
            if (result.success) {
                console.log(`💰 Profit: $${result.profit.toFixed(4)}\n`);
            }
        } else {
            console.log('⏳ Waiting for opportunities...\n');
        }

    } catch (error) {
        console.error('❌ Cycle error:', error.message);
    }
}

function runContinuous() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 TRIANGULAR ARBITRAGE BOT - AUTO MODE');
    console.log('='.repeat(80));
    console.log(`Configuration:`);
    console.log(`  Capital: $${CONFIG.capital}`);
    console.log(`  Min Profit: ${CONFIG.minProfitPercent * 100}%`);
    console.log(`  Check Interval: ${CONFIG.checkInterval}ms`);
    console.log(`  Trade Count: ${CONFIG.tradesPerCycle}\n`);

    // Run immediately
    triangularArbitrageCycle();

    // Set up continuous monitoring
    setInterval(() => {
        triangularArbitrageCycle();
    }, CONFIG.checkInterval);
}

// Run based on argument
if (process.argv[2] === 'continuous') {
    runContinuous();
} else {
    triangularArbitrageCycle();
}

module.exports = { triangularArbitrageCycle, executeArbitrage, detectAllArbitrageOpportunities };