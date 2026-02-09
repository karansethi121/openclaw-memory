# Binance Wallet → Exchange Transfer Guide

## Why This Is Needed

The API key is for **Binance Exchange** (trading platform), but your funds are in **Binance Wallet** (Web3 wallet).

These are two SEPARATE systems - the API cannot access the Binance Wallet directly.

---

## Transfer Instructions

### Step 1: Go to Binance Wallet
- Log into Binance
- Navigate to **Wallet** → **Withdraw** (or "Transfer")

### Step 2: Select Source and Destination
- **Source:** Binance Wallet
- **Destination:** Spot Wallet (Binance Exchange)

### Step 3: Transfer Settings
- **Select Asset:** USDT
- **Network:** Select the network (e.g., BEP20, ERC20, TRC20)
- **Amount:** 20 USDT

### Step 4: Confirm Transfer
- Verify the details
- Confirm the transaction

### Step 5: Wait for Confirmation
- Usually 1-5 minutes depending on network
- You'll receive confirmation when complete

---

## After Transfer

Once complete, the API will show:
```
USDT Balance: 20.00
```

Then we can:
1. Verify the balance via API
2. Set TEST_MODE to "false"
3. Start live trading! 🚀

---

## Verify Transfer Works

After transferring, run this command to verify:
```bash
node C:\Users\Karan\.openclaw\workspace\scripts\check-usdt-balance.js
```

It should show 20.00 USDT instead of 0.00

---

**Last Updated:** 2026-02-06 09:28 GMT
**Issue Resolved:** Identified Binance Wallet vs Exchange separation