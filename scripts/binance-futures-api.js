// Binance Futures API Integration
// Support for leverage trading, hedging, and arbitrage

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:\\Users\\Karan\\.openclaw\\openclaw.json', 'utf8'));
const API_KEY = config.env.BINANCE_API_KEY;
const API_SECRET = config.env.BINANCE_API_SECRET;

const BASE_URL = 'fapi.binance.com';

async function signedFuturesRequest(method, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString();
        const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

        const options = {
            hostname: BASE_URL,
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
                        reject(new Error(`Binance Futures Error ${parsed.code}: ${parsed.msg}`));
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

async function publicFuturesRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const queryString = new URLSearchParams(params).toString();
        
        https.get(`https://${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

// ============ ACCOUNT FUNCTIONS ============

async function getFuturesAccount() {
    return await signedFuturesRequest('GET', '/fapi/v2/account');
}

async function getFuturesBalance() {
    const account = await getFuturesAccount();
    return account.assets.find(a => a.asset === 'USDT');
}

async function openPositions() {
    const account = await getFuturesAccount();
    return account.positions.filter(p => parseFloat(p.positionAmt) !== 0);
}

// ============ LEVERAGE FUNCTIONS ============

async function setLeverage(symbol, leverage) {
    console.log(`🔧 Setting leverage to ${leverage}x for ${symbol}...`);
    const result = await signedFuturesRequest('POST', '/fapi/v1/leverage', {
        symbol: symbol,
        leverage: leverage
    });
    console.log(`✅ Leverage set: ${result.leverage}x`);
    return result;
}

async function getLeverage(symbol) {
    const account = await getFuturesAccount();
    const position = account.positions.find(p => p.symbol === symbol);
    return parseFloat(position.leverage);
}

// ============ TRADING FUNCTIONS ============

async function placeFuturesOrder(symbol, side, type, quantity, positionSide = 'LONG') {
    const params = {
        symbol: symbol,
        side: side,
        type: type,
        quantity: quantity.toFixed(8),
        positionSide: positionSide
    };

    console.log(`\n⚡ ORDER: ${side} ${quantity.toFixed(4)} ${symbol} @ MARKET`);
    const result = await signedFuturesRequest('POST', '/fapi/v1/order', params);
    console.log(`✅ Order ID: ${result.orderId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Filled: ${result.executedQty}`);
    return result;
}

async function placeStopLossOrder(symbol, side, quantity, stopPrice, positionSide = 'LONG') {
    console.log(`🛑 STOP LOSS: ${side} ${quantity.toFixed(4)} ${symbol} @ ${stopPrice}`);
    const result = await signedFuturesRequest('POST', '/fapi/v1/order', {
        symbol: symbol,
        side: side,
        type: 'STOP_MARKET',
        quantity: quantity.toFixed(8),
        stopPrice: stopPrice.toFixed(2),
        positionSide: positionSide
    });
    console.log(`✅ Stop Loss Placed: Order ID ${result.orderId}`);
    return result;
}

async function placeTakeProfitOrder(symbol, side, quantity, price, positionSide = 'LONG') {
    console.log(`🎯 TAKE PROFIT: ${side} ${quantity.toFixed(4)} ${symbol} @ ${price}`);
    const result = await signedFuturesRequest('POST', '/fapi/v1/order', {
        symbol: symbol,
        side: side,
        type: 'LIMIT',
        quantity: quantity.toFixed(8),
        price: price.toFixed(2),
        positionSide: positionSide,
        timeInForce: 'GTC'
    });
    console.log(`✅ Take Profit Placed: Order ID ${result.orderId}`);
    return result;
}

async function cancelAllOpenOrders(symbol) {
    console.log(`❌ Canceling all orders for ${symbol}...`);
    const result = await signedFuturesRequest('DELETE', '/fapi/v1/allOpenOrders', { symbol: symbol });
    console.log(`✅ Canceled ${result.length} orders`);
    return result;
}

// ============ MARKET DATA ============

async function getFuturesPrice(symbol) {
    const result = await publicFuturesRequest('/fapi/v1/ticker/price', { symbol });
    return parseFloat(result.price);
}

async function getFuturesOrderBook(symbol, limit = 10) {
    return await publicFuturesRequest('/fapi/v1/depth', { symbol, limit });
}

async function getFundingRate(symbol) {
    return await publicFuturesRequest('/fapi/v1/premiumIndex', { symbol });
}

async function getMarkPrice(symbol) {
    const result = await publicFuturesRequest('/fapi/v1/premiumIndex', { symbol });
    return parseFloat(result.markPrice);
}

// ============ ARBITRAGE FUNCTIONS ============

async function getSpotPrice(symbol) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                resolve(parseFloat(result.price));
            });
            res.on('error', reject);
        });
    });
}

async function detectSpotFuturesArbitrage(symbol) {
    console.log(`\n🔍 Checking arbitrage for ${symbol}...`);
    
    const [spotPrice, futuresPrice, fundingInfo] = await Promise.all([
        getSpotPrice(symbol),
        getFuturesPrice(symbol),
        getFundingRate(symbol)
    ]);

    const priceDiff = futuresPrice - spotPrice;
    const spreadPercent = (priceDiff / spotPrice) * 100;
    const fundingRate = parseFloat(fundingInfo.lastFundingRate) * 100;

    console.log(`   Spot: $${spotPrice.toFixed(2)}`);
    console.log(`   Futures: $${futuresPrice.toFixed(2)}`);
    console.log(`   Spread: $${priceDiff.toFixed(2)} (${spreadPercent.toFixed(3)}%)`);
    console.log(`   Funding Rate: ${fundingRate.toFixed(4)}%`);

    // Arbitrage opportunity if spread > 0.2%
    const isArbitrage = Math.abs(spreadPercent) > 0.2;
    
    if (isArbitrage) {
        console.log(`   ✅ ARBITRAGE OPPORTUNITY!`);
    } else {
        console.log(`   ⏳ No arbitrage (need >0.2% spread)`);
    }

    return {
        symbol,
        spotPrice,
        futuresPrice,
        priceDiff,
        spreadPercent,
        fundingRate,
        isArbitrage
    };
}

// ============ FUNDING RATE MONITOR ============

async function monitorFundingRate(symbol) {
    const fundingInfo = await getFundingRate(symbol);
    const fundingRate = parseFloat(fundingInfo.lastFundingRate);
    const nextFundingTime = new Date(fundingInfo.nextFundingTime);

    console.log(`\n💰 Funding Rate for ${symbol}:`);
    console.log(`   Rate: ${(fundingRate * 100).toFixed(4)}%`);
    console.log(`   Next Funding: ${nextFundingTime.toLocaleString()}`);

    // Positive funding = longs pay shorts
    if (fundingRate > 0.0001) {
        console.log(`   💡 Strategy: LONG spot, SHORT futures`);
        console.log(`   🎯 Passive income: ${(fundingRate * 3 * 100).toFixed(4)}% daily`);
        return { trade: 'SHORT', opportunity: 'HIGH' };
    }

    // Negative funding = shorts pay longs
    if (fundingRate < -0.0001) {
        console.log(`   💡 Strategy: SHORT spot, LONG futures`);
        console.log(`   🎯 Passive income: ${(-fundingRate * 3 * 100).toFixed(4)}% daily`);
        return { trade: 'LONG', opportunity: 'HIGH' };
    }

    console.log(`   ⏳ Funding rate small, no trade needed`);
    return { trade: 'NONE', opportunity: 'LOW' };
}

// ============ DEMO / TEST FUNCTIONS ============

async function futuresDemo() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 BINANCE FUTURES API - DEMO');
    console.log('='.repeat(80) + '\n');

    try {
        // Check account
        console.log('💼 Checking futures account...\n');
        const balance = await getFuturesBalance();
        console.log(`   USDT Balance: $${parseFloat(balance.balance).toFixed(2)}`);
        console.log(`   Available: $${parseFloat(balance.availableBalance).toFixed(2)}\n`);

        // Check open positions
        const positions = await openPositions();
        if (positions.length > 0) {
            console.log('📍 Open Positions:\n');
            positions.forEach(pos => {
                const pnl = parseFloat(pos.unRealizedProfit);
                const icon = pnl >= 0 ? '🟢' : '🔴';
                console.log(`   ${pos.symbol} ${pos.positionSide}: ${parseFloat(pos.positionAmt).toFixed(4)} @ ${parseFloat(pos.entryPrice).toFixed(2)}`);
                console.log(`   ${icon} PnL: $${pnl.toFixed(2)}\n`);
            });
        } else {
            console.log('✅ No open positions\n');
        }

        // Check arbitrage opportunities
        console.log('\n🔍 Checking Arbitrage Opportunities:\n');
        const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
        const results = await Promise.all(pairs.map(p => detectSpotFuturesArbitrage(p)));

        // Check funding rates
        console.log('\n💰 Checking Funding Rates:\n');
        await Promise.all(pairs.map(p => monitorFundingRate(p)));

        console.log('\n' + '='.repeat(80));
        console.log('✅ DEMO COMPLETE');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nNote: Futures account may not be active yet.');
        console.log('Go to Binance and activate futures trading first.\n');
    }
}

// Run demo if called directly
if (require.main === module) {
    futuresDemo();
}

module.exports = {
    getFuturesAccount,
    getFuturesBalance,
    openPositions,
    setLeverage,
    getLeverage,
    placeFuturesOrder,
    placeStopLossOrder,
    placeTakeProfitOrder,
    cancelAllOpenOrders,
    getFuturesPrice,
    getFuturesOrderBook,
    getFundingRate,
    getMarkPrice,
    getSpotPrice,
    detectSpotFuturesArbitrage,
    monitorFundingRate
};