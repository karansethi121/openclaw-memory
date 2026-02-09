// Crypto Trading Analytics Dashboard
// Tracks and visualizes trading performance, profit/loss, balance growth

const AnalyticsCollector = require('C:/Users/Karan/.openclaw/workspace/skills/analytics/analytics-collector.js');
const fs = require('fs');
const path = require('path');

class CryptoAnalytics {
  constructor(dataPath = 'C:\\Users\\Karan\\.openclaw\\workspace\\crypto-analytics-data.json') {
    this.dataPath = dataPath;
    this.analytics = new AnalyticsCollector();
    this.data = this.loadData();
  }

  // Load existing trading data
  loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Initializing new crypto analytics data:', error.message);
    }

    return {
      initialBalance: 20.00,
      currentBalance: 20.00,
      trades: [],
      dailyStats: {},
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
        winRate: 0,
        profitFactor: 0
      },
      bestDay: { date: 'N/A', profit: 0 },
      worstDay: { date: 'N/A', loss: 0 },
      streaks: {
        currentWin: 0,
        currentLoss: 0,
        longestWin: 0,
        longestLoss: 0
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  // Save trading data
  saveData() {
    this.data.lastUpdated = new Date().toISOString();
    const dir = path.dirname(this.dataPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
  }

  // Log a completed trade
  logTrade(trade) {
    const tradeRecord = {
      id: this.data.trades.length + 1,
      pair: trade.pair || 'UNKNOWN',
      type: trade.type || 'BUY', // BUY or SELL
      entryPrice: trade.entryPrice || 0,
      exitPrice: trade.exitPrice || 0,
      amount: trade.amount || 0,
      profitLoss: trade.profitLoss || 0,
      profitLossPercent: trade.profitLossPercent || 0,
      rsiEntry: trade.rsiEntry || 0,
      rsiExit: trade.rsiExit || 0,
      reason: trade.reason || 'Manual',
      duration: trade.duration || 0,
      timestamp: new Date().toISOString()
    };

    this.data.trades.push(tradeRecord);

    // Update balance
    this.data.currentBalance += trade.profitLoss;

    // Update performance metrics
    this.data.performance.totalTrades++;

    if (trade.profitLoss > 0) {
      this.data.performance.winningTrades++;
      this.data.performance.totalProfit += trade.profitLoss;
      this.data.streaks.currentWin++;
      this.data.streaks.currentLoss = 0;
      if (this.data.streaks.currentWin > this.data.streaks.longestWin) {
        this.data.streaks.longestWin = this.data.streaks.currentWin;
      }
    } else if (trade.profitLoss < 0) {
      this.data.performance.losingTrades++;
      this.data.performance.totalLoss += Math.abs(trade.profitLoss);
      this.data.streaks.currentLoss++;
      this.data.streaks.currentWin = 0;
      if (this.data.streaks.currentLoss > this.data.streaks.longestLoss) {
        this.data.streaks.longestLoss = this.data.streaks.currentLoss;
      }
    }

    // Calculate derived metrics
    this.calculateMetrics();

    // Update daily stats
    this.updateDailyStats(tradeRecord);

    // Update analytics system
    this.analytics.logTask(trade.profitLoss > 0 ? 'completed' : 'failed');
    this.analytics.logSkillUsage('crypto-trading');

    this.saveData();

    return tradeRecord;
  }

  // Calculate performance metrics
  calculateMetrics() {
    const perf = this.data.performance;

    // Win rate
    perf.winRate = perf.totalTrades === 0 ? 0 : Math.round((perf.winningTrades / perf.totalTrades) * 100);

    // Profit factor (total profit / total loss)
    perf.profitFactor = perf.totalLoss === 0 ? (perf.totalProfit > 0 ? Infinity : 0) : Math.round(perf.totalProfit / perf.totalLoss * 100) / 100;
  }

  // Update daily statistics
  updateDailyStats(trade) {
    const date = new Date().toISOString().split('T')[0];

    if (!this.data.dailyStats[date]) {
      this.data.dailyStats[date] = {
        trades: 0,
        profit: 0,
        loss: 0,
        netProfit: 0,
        balance: this.data.currentBalance
      };
    }

    const day = this.data.dailyStats[date];
    day.trades++;

    if (trade.profitLoss > 0) {
      day.profit += trade.profitLoss;
    } else {
      day.loss += Math.abs(trade.profitLoss);
    }

    day.netProfit = day.profit - day.loss;
    day.balance = this.data.currentBalance;

    // Update best/worst days
    if (day.netProfit > this.data.bestDay.profit) {
      this.data.bestDay = { date, profit: day.netProfit };
    }

    if (day.netProfit < this.data.worstDay.loss) {
      this.data.worstDay = { date, loss: day.netProfit };
    }
  }

  // Get current portfolio status
  getPortfolioStatus() {
    const growth = this.data.currentBalance - this.data.initialBalance;
    const growthPercent = (growth / this.data.initialBalance) * 100;

    return {
      initialBalance: this.data.initialBalance.toFixed(2),
      currentBalance: this.data.currentBalance.toFixed(2),
      growth: growth.toFixed(2),
      growthPercent: growthPercent.toFixed(2),
      trades: this.data.performance.totalTrades,
      winRate: this.data.performance.winRate + '%'
    };
  }

  // Generate performance report
  generateReport() {
    const portfolio = this.getPortfolioStatus();
    const perf = this.data.performance;

    return `
📊 CRYPTO TRADING ANALYTICS REPORT
===================================

📈 PORTFOLIO STATUS
─────────────────────
Initial Balance: $${portfolio.initialBalance}
Current Balance: $${portfolio.currentBalance}
Growth: $${portfolio.growth} (${portfolio.growthPercent}%)
Total Trades: ${portfolio.trades}
Win Rate: ${portfolio.winRate}

🎯 PERFORMANCE METRICS
──────────────────────
Winning Trades: ${perf.winningTrades}
Losing Trades: ${perf.losingTrades}
Total Profit: $${perf.totalProfit.toFixed(2)}
Total Loss: $${perf.totalLoss.toFixed(2)}
Profit Factor: ${perf.profitFactor === Infinity ? '∞' : perf.profitFactor}

🔥 STREAKS
──────────
Current Win Streak: ${this.data.streaks.currentWin}
Current Loss Streak: ${this.data.streaks.currentLoss}
Longest Win Streak: ${this.data.streaks.longestWin}
Longest Loss Streak: ${this.data.streaks.longestLoss}

📅 BEST / WORST DAYS
─────────────────────
Best Day: ${this.data.bestDay.date} (+$${this.data.bestDay.profit.toFixed(2)})
Worst Day: ${this.data.worstDay.date} ($${this.data.worstDay.loss.toFixed(2)})

📝 RECENT TRADES
────────────────
${this.getRecentTrades(5)}

Last Updated: ${new Date(this.data.lastUpdated).toLocaleString()}
===================================
`;
  }

  // Get recent trades
  getRecentTrades(count = 5) {
    const recent = this.data.trades.slice(-count).reverse();
    return recent.map(t => {
      const icon = t.profitLoss > 0 ? '✅' : (t.profitLoss < 0 ? '❌' : '➖');
      return `${icon} ${t.pair}: ${t.profitLoss >= 0 ? '+' : ''}$${t.profitLoss.toFixed(2)} (${t.profitLossPercent.toFixed(2)}%)`;
    }).join('\n');
  }

  // Export data for charting
  exportChartData() {
    const dates = Object.keys(this.data.dailyStats).sort();
    const balances = dates.map(d => this.data.dailyStats[d].balance);
    const profits = dates.map(d => this.data.dailyStats[d].netProfit);

    return {
      dates,
      balances,
      profits,
      tradesPerDay: dates.map(d => this.data.dailyStats[d].trades)
    };
  }

  // Generate simple ASCII chart
  generateASCIIChart(dataPoints, width = 50) {
    if (dataPoints.length === 0) return 'No data available';

    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const range = max - min || 1;

    return dataPoints.map((val, i) => {
      const normalized = (val - min) / range;
      const barLength = Math.round(normalized * width);
      const bar = '█'.repeat(barLength) + '░'.repeat(width - barLength);
      const label = `${(i * (100 / dataPoints.length)).toFixed(0)}%`;
      return `${label.padStart(5)} │ ${bar} ${val.toFixed(2)}`;
    }).join('\n');
  }

  // Full dashboard output
  getDashboard() {
    const portfolio = this.getPortfolioStatus();
    const chartData = this.exportChartData();

    let output = this.generateReport();

    if (chartData.dates.length > 0) {
      output += '\n\n📊 BALANCE GROWTH CHART\n';
      output += '───────────────────────\n';
      output += this.generateASCIIChart(chartData.balances);
    }

    return output;
  }
}

module.exports = CryptoAnalytics;