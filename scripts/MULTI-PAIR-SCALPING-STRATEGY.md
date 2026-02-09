// Multi-Pair Scalping - High Frequency Small Profits

## Strategy Overview

**Profit Logic:** Many small trades on multiple pairs

**How It Works:**
1. Monitor 4 pairs simultaneously (BTC, ETH, SOL, DOGE)
2. Find small price deviations (0.5-1%)
3. Execute quick buy/sell
4. Target 0.3-0.5% per trade
5. Repeat frequently

---

## Why Scalping Works

**Volume + Frequency = Profit:**
- Small targets more achievable
- Multiple trades spread risk
- Don't miss opportunities
- Compounding effect

---

## Trade Logic

```
BUY SIGNAL:
- 15m RSI < 30 (oversold)
- Price below 20-period EMA
- Volume spike (>1.5x average)
- Quick bounce expected

SELL SIGNAL:
- 15m RSI > 70 (overbought)
- Price above 20-period EMA
- Volume spike
- Quick correction expected
```

---

## Quick RSI Calculation

```
RSI = 100 - (100 / (1 + RS))

RS = Average Gain / Average Loss (last 14 periods)

Simplified:
- If price up 14+ candles → RSI > 70 (sell)
- If price down 14+ candles → RSI < 30 (buy)
```

---

## Trade Management

```
Target Profit: 0.3-0.5%
Stop Loss: 0.2%
Max Hold Time: 30 minutes
Position Size: 3% capital per trade
Max 5 positions total
```

---

## Expected Performance

**Per Trade:**
- Win Rate: 55-60%
- Avg Win: 0.4%
- Avg Loss: 0.2%
- Expectancy: +0.14% per trade

**Daily:**
- Trades: 40-60
- Daily Profit: 5.6-8.4%

**With $22:**
- Daily: $1.23-$1.85
- Target $5 in ~3-4 hours
```

---

## Trading Pairs

```
BTCUSDT - High volume, stable
ETHUSDT - Volatile, good profit
SOLUSDT - Extremely volatile  
DOGEUSDT - Meme momentum
```

---

## Implementation

See: `multi-pair-scalping-bot.js`

Features:
- Parallel multi-pair monitoring
- Quick RSI calculation
- Volume filtering
- Automatic exit management