# Crypto Analytics Integration Guide

## Overview
The crypto analytics dashboard has been created to track trading performance, profit/loss, and balance growth.

## How It Works

### Data Tracked
- **Portfolio Status:** Initial balance, current balance, growth, win rate
- **Performance Metrics:** Winning trades, losing trades, total profit, total loss, profit factor
- **Streaks:** Current win/loss streak, longest win/loss streak
- **Daily Stats:** Trades per day, profit/loss each day, best/worst days
- **Trade History:** Every trade with entry/exit price, profit/loss, RSI, reason

### Analytics Dashboard
```
📊 CRYPTO TRADING ANALYTICS REPORT
=============================
📈 PORTFOLIO STATUS
   Initial: $20.00
   Current: $20.20
   Growth: +1.02%
🎯 PERFORMANCE METRICS
   Win Rate: 67%
   Profit Factor: 2.95
📝 RECENT TRADES
   ✅ BTCUSDT: +$0.15 (3.04%)
   ❌ ETHUSDT: -$0.10 (-2.09%)
   ✅ SOLUSDT: +$0.16 (3.13%)
```

## Integration with Trading Bot

### Step 1: Add Analytics Import
```javascript
const CryptoAnalytics = require('C:/Users/Karan/.openclaw/workspace/scripts/crypto-analytics.js');
const analytics = new CryptoAnalytics();
```

### Step 2: Log Completed Trades
After each trade execution in `binance-trading-bot.js`:

```javascript
// After successful BUY order
const entryPrice = order.price || currentPrice;
const takeProfitPrice = currentPrice * (1 + TAKE_PROFIT_PERCENT);
const stopLossPrice = currentPrice * (1 - STOP_LOSS_PERCENT);

// Store trade for analytics
activeTrades[pair] = {
  entryPrice,
  quantity,
  takeProfitPrice,
  stopLossPrice,
  entryRSI: rsi,
  entryTime: Date.now()
};

// After successful SELL order (exit position)
const exitPrice = order.price || currentPrice;
const profitLoss = (exitPrice - entryPrice) * quantity;
const profitLossPercent = (profitLoss / (entryPrice * quantity)) * 100;

// Log to analytics
analytics.logTrade({
  pair: pair,
  type: 'SELL',
  entryPrice: entryPrice,
  exitPrice: exitPrice,
  amount: entryPrice * quantity,
  profitLoss: profitLoss,
  profitLossPercent: profitLossPercent,
  rsiEntry: entryRSI,
  rsiExit: rsi,
  reason: exitReason, // e.g., 'Take Profit Hit', 'Stop Loss Hit'
  duration: (Date.now() - entryTime) / 1000 // seconds
});
```

### Step 3: Generate Reports
Add this to the hourly trading cycle:

```javascript
// At end of trading cycle
console.log('\n📊 Trading Analytics:');
console.log(analytics.getDashboard());

// Generate daily report at 8 PM IST
const hour = new Date().getHours();
if (hour === 20) { // 8 PM IST
  const report = analytics.getDashboard();
  // Send to Telegram (if configured)
}
```

## Files Created

### crypto-analytics.js
Main analytics engine:
- `logTrade()` - Log a completed trade
- `getPortfolioStatus()` - Get current portfolio
- `generateReport()` - Generate text report
- `exportChartData()` - Export for charting
- `getDashboard()` - Full dashboard output

### crypto-analytics-data.json
Generated automatically, contains:
- All trade history
- Performance metrics
- Daily statistics
- Streaks and best/worst days

## Cron Jobs

### Daily Analytics Report (8 PM IST)
```json
{
  "name": "crypto-daily-analytics",
  "schedule": { "expr": "0 20 * * *", "tz": "Asia/Kolkata" },
  "action": "Generate daily crypto analytics report and send to Telegram"
}
```

### Weekly Performance Summary (Sunday 10 PM IST)
```json
{
  "name": "crypto-weekly-summary",
  "schedule": { "expr": "0 22 * * 0", "tz": "Asia/Kolkata" },
  "action": "Generate weekly crypto trading performance summary"
}
```

## Usage

### View Dashboard Anytime
```bash
node -e "
const CryptoAnalytics = require('C:/Users/Karan/.openclaw/workspace/scripts/crypto-analytics.js');
const analytics = new CryptoAnalytics();
console.log(analytics.getDashboard());
"
```

### Manual Trade Log
```bash
node -e "
const CryptoAnalytics = require('C:/Users/Karan/.openclaw/workspace/scripts/crypto-analytics.js');
const analytics = new CryptoAnalytics();
analytics.logTrade({
  pair: 'SOLUSDT',
  type: 'SELL',
  entryPrice: 80.00,
  exitPrice: 82.50,
  amount: 5.00,
  profitLoss: 0.15625,
  profitLossPercent: 3.125,
  rsiEntry: 62,
  rsiExit: 75,
  reason: 'Take Profit Hit',
  duration: 3600
});
console.log('Trade logged successfully');
console.log(analytics.getPortfolioStatus());
"
```

## Benefits

1. **Track Profit/Lloss** - See exactly how much you're making/losing
2. **Win Rate Analysis** - Understand your success rate
3. **Streak Tracking** - See hot/cold streaks
4. **Daily Performance** - Best and worst days
5. **Balance Growth** - Visualize portfolio growth
6. **Historical Records** - All trades stored permanently
7. **Telegram Integration** - Get reports automatically

## Next Steps

1. **Integrate with Trading Bot** - Add analytics logging to `binance-trading-bot.js`
2. **Create Daily Cron Job** - Schedule 8 PM IST analytics reports
3. **Telegram Reporting** - Send daily summary to Telegram
4. **Chart.js Integration** - Create visual charts using canvas skill
5. **Profit Goals** - Set and track profit targets

---

**Created:** 2026-02-06 10:30 AM IST
**Status:** Analytics system working and tested
**Integration:** Ready to add to trading bot