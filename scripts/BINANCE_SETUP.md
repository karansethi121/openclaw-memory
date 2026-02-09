# Binance API Setup Instructions

## Step 1: Create Binance API Keys

1. Go to: https://www.binance.com/en/my/settings/api-management
2. Click "Create API"
3. Label it: "OpenClaw Trading Bot"
4. Select permissions:
   - ✅ Enable Reading
   - ✅ Enable Spot & Margin Trading
   - ✅ Enable Futures (required for leverage)
   - ❌ Enable Withdrawals (recommended: leave unchecked)
5. (Optional) Add IP whitelist if you know your IP
6. Copy the **API Key** and **Secret Key**

## Step 2: Configure API Credentials

Add credentials to your OpenClaw gateway config file at `C:\Users\Karan\.openclaw\openclaw.json`:

```json
{
  "env": {
    "BINANCE_API_KEY": "your_actual_api_key_here",
    "BINANCE_API_SECRET": "your_actual_secret_key_here",
    "TEST_MODE": "true"  // Set to "false" for live trading
  }
}
```

**The bot automatically reads from this config file** - no manual environment setup needed.

To update credentials:
1. Edit the config file
2. Restart the gateway: `openclaw gateway restart`

## Step 3: Test the Connection

Run this command to verify your API works:

```bash
node C:\Users\Karan\.openclaw\workspace\scripts\binance-trading-bot.js
```

## Important Notes

⚠️ **NEVER share your API keys** - they give access to your funds
⚠️ **Start with TEST_MODE=true** - Verify everything works first
⚠️ **Small capital first** - Start with $20 as planned
⚠️ **Enable IP whitelist** - Protects your keys

## Trading Parameters (Auto-Configured)

- Initial Capital: $20 USD
- Position Size: $5 per trade (4 positions max)
- Stop Loss: 2% (-$0.10 per trade)
- Take Profit: 3% (+$0.15 per trade)
- Check Interval: Every 1 hour
- Pairs: SOL/USDT, ETH/USDT, BTC/USDT, BNB/USDT

## Expected Results

- Daily trades: 5-10 (depending on market)
- Profit target: 2-5% per trade
- Daily potential: $1-2 (10% daily on $20)
- Monthly potential: 300-500% if consistent

⚠️ **Realistic warning:** 10% daily is aggressive. First week target: 2-3% daily or break-even.

---

Once configured, the bot will run automatically every hour via cron job.