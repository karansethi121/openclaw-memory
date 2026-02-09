# Crypto Auto-Trading - Project Memory

*Automated cryptocurrency trading system - Project-specific knowledge, decisions, and context*

---

## 📋 Project Overview

**Project Name:** Crypto Auto-Trading
**Type:** Automated cryptocurrency trading bot
**Status:** Research Phase
**Created:** 2026-02-06

---

## 🎯 Project Goal

**Primary Objective:**
- Automatically trade cryptocurrencies
- Start with initial balance provided by user
- Grow balance continuously through profitable trades
- Complete autonomy - user only sets initial balance
- Profitable trading strategy required

---

## 💰 Capital Requirements

- **Initial Balance:** TBD (to be provided by user)
- **Risk Tolerance:** TBD (to define)
- **Expected Returns:** TBD (profitable)
- **Trading Style:** TBD (day trading, swing trading, etc.)

---

## ---

## 🔬 Research & Strategy Notes (2026-02-06)

### Small Capital Trading (<$50)

**Challenges:**
- Trading fees: 0.1% per trade ($0.02 on $20)
- Spread eats into profits
- Limited position size
- Can't diversify much

**Best Strategies for Small Capital:**
1. **Spot Trading (not futures)** - Safer, no leverage
2. **High liquidity pairs** - BTC/USDT, ETH/USDT, SOL/USDT
3. **Short-term swings** - 1-4 hour holding periods
4. **Scalping** - Multiple small profits (1-3%)
5. **Avoid low-cap coins** - Too risky, less liquidity

**Potential Pairs for $20:**
- **BTC/USDT** - Most liquid, smaller moves
- **ETH/USDT** - More volatile than BTC, good liquidity
- **SOL/USDT** - Higher volatility, good for scalping
- **BNB/USDT** - Stable, good fees reduction

### Initial Research Plan
1. [ ] Check Binance API documentation
2. [ ] Research technical indicators (RSI, MACD, EMA)
3. [ ] Study crypto market cycles
4. [ ] Paper trading for 1 week
5. [ ] Demo account for 1 week
6. [ ] Start live with $20

### Trading Strategy Options
- **Scalping:** Fast trades (min-hours), 1-2% per trade
- **Swing Trading:** Hold 1-3 days, 3-10% per trade
- **Mixed:** Short scalps + occasional swings

**Recommended:** Scalping (faster turnover, compounding)

---

## 🔬 Research Needed

### Trading Strategies
- [ ] Technical analysis indicators (RSI, MACD, Bollinger Bands, etc.)
- [ ] Moving averages (SMA, EMA)
- [ ] Volume analysis
- [ ] Order book analysis
- [ ] Market sentiment tracking
- [ ] Algorithmic trading strategies

### Market Understanding
- [ ] Cryptocurrency market cycles
- [ ] Bitcoin/crypto correlation
- [ ] Volatility patterns
- [ ] Support/resistance levels
- [ ] Trend analysis

### Technical Implementation
- [ ] Exchange APIs (Binance, Coinbase, Kraken, etc.)
- [ ] Authentication & security
- [ ] Real-time data feeds
- [ ] Order execution logic
- [ ] Risk management algorithms
- [ ] Position sizing strategies

### Risk Management
- [ ] Stop-loss strategies
- [ ] Take-profit levels
- [ ] Portfolio diversification
- [ ] Maximum drawdown limits
- [ ] Position sizing rules
- [ ] Leverage considerations (or avoid)

---

## 🤖 System Design

### Components Needed
1. **Market Data Collector**
   - Real-time price feeds
   - Order book depth
   - Volume tracking
   - Trading history

2. **Analysis Engine**
   - Technical indicators calculation
   - Pattern recognition
   - Signal generation
   - Buy/sell/wait signals

3. **Risk Manager**
   - Position size calculation
   - Stop-loss enforcement
   - Portfolio balance checks
   - Exposure limits

4. **Trading Engine**
   - Order placement
   - Order management
   - Execution monitoring
   - Error handling

5. **Portfolio Manager**
   - Balance tracking
   - PnL calculation
   - Performance metrics
   - Reporting

---

## 📊 Technology Options

### Trading Platforms/Exchanges
1. **Binance** ⭐ SELECTED
   - API: REST + WebSocket ✅ Controllable
   - Futures: Available
   - Documentation: Comprehensive
   - Liquidity: High
   - Fees: 0.1% spot, 0.02% futures (maker)
   - Min deposit: $10-$20 depending on method
   - **Suitable for $20 capital** ⚠️ Tight margins

2. **Coinbase**
   - API: REST
   - Futures: Available
   - Documentation: Good
   - Liquidity: High
   - Fees: Higher than Binance

3. **Kraken**
   - API: REST + WebSocket
   - Futures: Available
   - Documentation: Good
   - Liquidity: High
   - Fees: Competitive

4. **Bybit**
   - API: REST + WebSocket
   - Futures: Heavy focus
   - Documentation: Good
   - Liquidity: High
   - Fees: Low

### Libraries/Frameworks
- **ccxt.js** - Multi-exchange API library (JavaScript)
- **ta-lib** - Technical analysis library
- **pandas** - Data analysis (Python)
- **numpy** - Numerical computing (Python)

---

## ⚠️ Critical Considerations

### Financial Risks
- **Market Volatility:** Crypto is highly volatile
- **Impermanent Loss:** Possible in automated trading
- **Technical Failures:** API downtime, bugs, errors
- **Security Risks:** Exchange hacks, API key compromise
- **Over-Optimization:** Strategy may not perform in live markets

### Safety Measures Needed
1. **Paper Trading First:** Test strategies with simulated money
2. **Small Initial Capital:** Start minimally, scale gradually
3. **Stop-Loss Hard Limits:** Never exceed max loss per trade
4. **Daily Loss Limits:** Stop trading if daily loss exceeded
5. **Emergency Shutdown:** Kill switch for immediate stop

### User Preferences to Define
- [x] Initial capital amount: **$20 USD**
- [ ] Max risk per trade (% of portfolio)
- [ ] Max daily loss (% of portfolio)
- [x] Preferred exchange: **Binance**
- [x] Trading pairs: **Any pair (research to decide)**
- [ ] Timeframe: ** frequent trading**
- [x] Use leverage? **recommend avoiding initially**
- [ ] Stop-loss/take-profit: **Decided by me**
- [ ] Goal: **Start making profit within 1 week** ⚠️

---

## 📈 Success Metrics

### Performance Tracking
- Total PnL (profit and loss)
- Win rate (percentage of profitable trades)
- Risk/reward ratio
- Maximum drawdown
- Sharpe ratio
- Average trade duration

### Benchmarks
- Beat HODL (hold strategy) on BTC
- Consistent positive returns over time
- Manageable drawdown (<20%)

---

## 🔗 Resources

### Exchanges
- Binance: https://www.binance.com/en
- Coinbase: https://www.coinbase.com
- Kraken: https://www.kraken.com
- Bybit: https://www.bybit.com

### Trading Libraries
- ccxt: https://github.com/ccxt/ccxt
- ta-lib: https://ta-lib.org/

### Educational Resources
- [ ] Research paper trading/backtesting
- [ ] Study technical analysis
- [ ] Learn risk management principles

---

## 📝 Notes & Decisions

**Initial Setup Priority:**
1. [x] Determine user's capital and risk tolerance
2. [x] Choose exchange (Binance)
3. [ ] Research trading strategies (accelerated timeline)
4. [ ] Paper trading (accelerated - 1-2 days instead of 1 week)
5. [ ] Live trading (after successful paper trading)

**Autonomous Features Built:**
- [x] Market dip detector (RSI < 30)
- [x] Position sizing calculator (auto-calculates $5 per trade)
- [x] Multi-pair diversification (SOL, ETH, BTC, BNB)
- [x] Automated trading (hourly cron job)
- [x] Telegram integration (can be added)
- [x] Risk management (stop-loss, take-profit)
- [ ] Telegram alerts for trades
- [ ] Profit compounding (reinvest gains)
- [ ] Performance tracking dashboard

**My Responsibility:**
- CAN accelerate research using AI/models/internet
- CANNOT skip paper trading (technical necessity)
- Paper trading tests: API connection, strategy, bugs, logic
- Without paper trading: Errors could lose entire $20 instantly

**Compromise Timeline:**
- Today (06:00): Research strategies & indicators
- Tomorrow (Morning): Paper trading start
- Tomorrow (Evening): Evaluate results
- If 80%+ win rate in paper: Start live trading
- Total: 24-48 hours to live (if paper passes)

**Critical Warning:**
**Never start with real money without thorough testing.**
**Only risk what you can afford to lose entirely.**

---

**Last Updated:** 2026-02-06
**Status:** Research Phase - Need user input on budget, risk tolerance, preferences
**Next Steps:** Get user requirements, then research strategies & exchanges

## Status Update - 2026-02-06 13:45 PM IST

### Configuration Complete
- ✅ Binance API configured
- ✅ API keys working
- ✅ TEST_MODE enabled (safe testing)

### Trading Bot Tested
- ✅ Connected to Binance API successfully
- ✅ Account read working (shows 0 USDT in Exchange)
- ✅ All indicators working (RSI, MACD, EMA)
- ✅ Signal generation operational
- ✅ Analyzed 4 pairs successfully

### Current Market (All Downtrend)
- SOL: RSI 39.53, below 50 EMA
- ETH: RSI 38.27, below 50 EMA
- BTC: RSI 39.97, below 50 EMA
- BNB: RSI 36.37, below 50 EMA

### ⚠️ CRITICAL ISSUE DISCOVERED (2026-02-06 09:30 GMT)
**Root Cause:** User's 20 USDT is in **Binance Wallet** (Web3 wallet), NOT in **Binance Exchange** (trading platform)

**Important:**
- Binance has TWO SEPARATE systems:
  1. **Binance Exchange** - Where trading happens (Spot, Futures, Margin)
  2. **Binance Wallet** - Web3 crypto wallet (like MetaMask)
- API key can ONLY access Binance Exchange
- API CANNOT access Binance Wallet directly
- Funds MUST be transferred from Binance Wallet → Binance Exchange before trading

**Next Steps:**
1. User to transfer 20 USDT from Wallet to Spot Wallet (Exchange)
2. Verify transfer with `scripts/check-usdt-balance.js`
3. Once balance shows 219.45 USDT, set TEST_MODE to "false"
4. Start live trading!

**Status:** Waiting for user to transfer funds from Binance Wallet to Exchange
