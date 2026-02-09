 Funding Rate Arbitrage - 24/7 Passive Income

## What Is It?

**Strategy:** Earn funding rate premium by hedging spot with futures

**How It Works:**
1. Buy crypto in spot market
2. Short same amount in futures
3. Market movements cancel out (net position = 0)
4. Funding rate paid to short position every 8 hours
5. Keep the funding premium as profit

**Example with $10:**
```
Spot: Buy $10 worth of BTC
Futures: Short $10 worth of BTC
Net market exposure: $0 (hedged)
Funding rate: 0.01% every 8 hours
Daily profit: 0.03% = $0.003 per day
Monthly profit: ~$0.10 with $10

Better scenario:
Funding rate: 0.05% happens often
Daily: 0.15% = $0.015/day  
Monthly: ~$0.50 with $10
```

## Why Perfect for Low Capital?

✅ **No minimum requirements** - Start with $5-10
✅ **Continuous Income** - Paid every 8 hours automatically
✅ **Low Risk** - Market hedged, direction doesn't matter
✅ **No Waiting** - Earning from day 1, no signals needed
✅ **Always Active** - Funding paid 3 times daily

## Funding Rate Schedule

Binance funding payment times (UTC):
- 00:00 (5:30 AM IST)
- 08:00 (1:30 PM IST)
- 16:00 (9:30 PM IST)

You receive funding when funding rate is positive (short earns)

## How to Check Funding Rates

```bash
# Get current funding rates
curl https://fapi.binance.com/fapi/v1/premiumIndex
```

Positive funding = Short gets paid = Profit!

## Risk Management

**Only trade when funding > 0.02%** (minimum profitable rate)

**Rebalance if price moves > 1%** between spot and futures:

```javascript
if (Math.abs(spotPrice - futuresPrice) / spotPrice > 0.01) {
  // Rebalance hedge
  Close one side
  Reopen at new price
}
```

## Implementation

See: funding-rate-arbitrage-bot.js

Starts automatically with $7-10 capital
Auto-rebalances when needed
Tracks funding income
Telegram notifications for payments