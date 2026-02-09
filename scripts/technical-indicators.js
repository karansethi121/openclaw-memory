// Technical Indicators Calculator for Crypto Trading
// Calculates RSI, MACD, EMA for trading signals

class TechnicalIndicators {
  // Calculate Exponential Moving Average (EMA)
  static calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  }

  // Calculate RSI (Relative Strength Index)
  static calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    }

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Calculate MACD (Moving Average Convergence Divergence)
  static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;

    // For signal line, we'd need MACD history. Simplified:
    const signalLine = macdLine * 0.9; // Approximation
    const histogram = macdLine - signalLine;

    return {
      macdLine,
      signalLine,
      histogram,
      trend: macdLine > signalLine ? 'UP' : 'DOWN'
    };
  }

  // Generate trading signal
  static generateSignal(prices) {
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const ema50 = this.calculateEMA(prices, 50);
    const currentPrice = prices[prices.length - 1];

    const signals = {
      rsi: null,
      macd: null,
      ema: null,
      overall: 'HOLD'
    };

    // RSI Signal
    if (rsi > 70) {
      signals.rsi = 'SELL (Overbought)';
    } else if (rsi < 30) {
      signals.rsi = 'BUY (Oversold)';
    } else {
      signals.rsi = 'NEUTRAL';
    }

    // MACD Signal
    if (macd.trend === 'UP' && macd.histogram > 0) {
      signals.macd = 'BUY (Uptrend)';
    } else if (macd.trend === 'DOWN' && macd.histogram < 0) {
      signals.macd = 'SELL (Downtrend)';
    } else {
      signals.macd = 'NEUTRAL';
    }

    // EMA Signal
    if (currentPrice > ema50) {
      signals.ema = 'BUY (Above EMA)';
    } else {
      signals.ema = 'SELL (Below EMA)';
    }

    // Overall Signal (Simple logic)
    const buySignals = [signals.rsi, signals.macd, signals.ema].filter(s => s?.includes('BUY')).length;
    const sellSignals = [signals.rsi, signals.macd, signals.ema].filter(s => s?.includes('SELL')).length;

    if (buySignals >= 2) {
      signals.overall = 'BUY';
    } else if (sellSignals >= 2) {
      signals.overall = 'SELL';
    }

    return {
      ...signals,
      currentPrice,
      rsi,
      macd,
      ema50
    };
  }
}

// Export for use
console.log('Technical Indicators module loaded');
module.exports = TechnicalIndicators;