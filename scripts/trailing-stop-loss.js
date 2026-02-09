// Trailing Stop-Loss Module
// Automatically moves stop-loss up as price moves favorably to lock in profits

class TrailingStopLoss {
  constructor(entryPrice, stopLossPercent = 0.02) {
    this.entryPrice = entryPrice;
    this.stopLossPercent = stopLossPercent;
    this.initialSL = entryPrice * (1 - stopLossPercent);
    this.currentSL = this.initialSL;
    this.highestPrice = entryPrice;
    this.lowestPrice = entryPrice;
    this.isLong = true; // For long positions (buy first)
  }

  // Update stop-loss based on current price
  // Returns { shouldExit, currentSL, lockedProfit, trigger }
  update(currentPrice) {
    if (this.isLong) {
      return this._updateLong(currentPrice);
    } else {
      return this._updateShort(currentPrice);
    }
  }

  // For long positions (buy low, sell high)
  _updateLong(currentPrice) {
    const profitPercent = (currentPrice - this.entryPrice) / this.entryPrice;

    // Track highest price reached
    if (currentPrice > this.highestPrice) {
      this.highestPrice = currentPrice;
    }

    let trigger = null;

    // Move stop-loss up based on profit levels
    if (profitPercent >= 0.005) {
      // Profit > 0.5%: Lock breakeven at -0.1%
      const breakevenSL = this.entryPrice * 0.999;
      if (this.currentSL < breakevenSL) {
        this.currentSL = breakevenSL;
        trigger = 'profit_0.5_breakeven';
      }
    }

    if (profitPercent >= 0.015) {
      // Profit > 1.5%: Lock +0.5%
      const lockedSL = this.entryPrice * 1.005;
      if (this.currentSL < lockedSL) {
        this.currentSL = lockedSL;
        trigger = 'profit_1.5_locked';
      }
    }

    if (profitPercent >= 0.025) {
      // Profit > 2.5%: Lock +1.5%
      const lockedSL = this.entryPrice * 1.015;
      if (this.currentSL < lockedSL) {
        this.currentSL = lockedSL;
        trigger = 'profit_2.5_locked';
      }
    }

    // Check if stop-loss hit
    const shouldExit = currentPrice <= this.currentSL;

    // Calculate locked profit
    const lockedProfit = profitPercent >= 0.005
      ? Math.max(0, (this.currentSL - this.entryPrice) / this.entryPrice)
      : 0;

    return {
      shouldExit,
      currentSL: this.currentSL,
      lockedProfit,
      lockedProfitPercent: lockedProfit * 100,
      profitPercent: profitPercent * 100,
      trigger,
      highestPrice: this.highestPrice,
      maxGainPercent: ((this.highestPrice - this.entryPrice) / this.entryPrice) * 100
    };
  }

  // For short positions (sell high, buy low)
  _updateShort(currentPrice) {
    const profitPercent = (this.entryPrice - currentPrice) / this.entryPrice;

    // Track lowest price reached
    if (currentPrice < this.lowestPrice) {
      this.lowestPrice = currentPrice;
    }

    let trigger = null;

    // Move stop-loss down based on profit levels
    if (profitPercent >= 0.005) {
      // Profit > 0.5%: Lock breakeven at +0.1%
      const breakevenSL = this.entryPrice * 1.001;
      if (this.currentSL > breakevenSL) {
        this.currentSL = breakevenSL;
        trigger = 'profit_0.5_breakeven';
      }
    }

    if (profitPercent >= 0.015) {
      // Profit > 1.5%: Lock -0.5%
      const lockedSL = this.entryPrice * 0.995;
      if (this.currentSL > lockedSL) {
        this.currentSL = lockedSL;
        trigger = 'profit_1.5_locked';
      }
    }

    if (profitPercent >= 0.025) {
      // Profit > 2.5%: Lock -1.5%
      const lockedSL = this.entryPrice * 0.985;
      if (this.currentSL > lockedSL) {
        this.currentSL = lockedSL;
        trigger = 'profit_2.5_locked';
      }
    }

    // Check if stop-loss hit (exit when price goes above SL)
    const shouldExit = currentPrice >= this.currentSL;

    // Calculate locked profit
    const lockedProfit = profitPercent >= 0.005
      ? Math.max(0, (this.entryPrice - this.currentSL) / this.entryPrice)
      : 0;

    return {
      shouldExit,
      currentSL: this.currentSL,
      lockedProfit,
      lockedProfitPercent: lockedProfit * 100,
      profitPercent: profitPercent * 100,
      trigger,
      lowestPrice: this.lowestPrice,
      maxGainPercent: ((this.entryPrice - this.lowestPrice) / this.entryPrice) * 100
    };
  }

  // Get current status
  getStatus() {
    return {
      entryPrice: this.entryPrice,
      initialSL: this.initialSL,
      currentSL: this.currentSL,
      isLong: this.isLong,
      highestPrice: this.highestPrice,
      lowestPrice: this.lowestPrice,
      slMovement: ((this.currentSL - this.initialSL) / this.initialSL) * 100
    };
  }

  // Reset for new position
  reset(entryPrice, isLong = true) {
    this.entryPrice = entryPrice;
    this.isLong = isLong;
    this.initialSL = isLong
      ? entryPrice * (1 - this.stopLossPercent)
      : entryPrice * (1 + this.stopLossPercent);
    this.currentSL = this.initialSL;
    this.highestPrice = entryPrice;
    this.lowestPrice = entryPrice;
  }
}

module.exports = TrailingStopLoss;