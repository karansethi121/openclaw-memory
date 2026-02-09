// Crypto Trading - Daily Analytics Report Generator
// Generates and sends daily trading performance summary

const CryptoAnalytics = require('C:/Users/Karan/.openclaw/workspace/scripts/crypto-analytics.js');
const fs = require('fs');
const path = require('path');

async function generateDailyReport() {
  console.log('📊 Generating Daily Crypto Trading Analytics...\n');

  const analytics = new CryptoAnalytics();
  const portfolio = analytics.getPortfolioStatus();
  const report = analytics.getDashboard();

  // Save report to file
  const reportsDir = 'C:\\Users\\Karan\\.openclaw\\workspace\\reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const reportFile = path.join(reportsDir, `crypto-analytics-${date}.txt`);

  fs.writeFileSync(reportFile, report);
  console.log(`✅ Report saved to: ${reportFile}`);

  // Log to daily memory
  const memoryDir = 'C:\\Users\\Karan\\.openclaw\\workspace\\memory';
  const memoryFile = path.join(memoryDir, `${date}.md`);

  let memoryEntry = `\n## 📊 Crypto Trading Analytics - ${date}\n\n`;
  memoryEntry += `${report}\n`;
  memoryEntry += `\n**Report File:** ${reportFile}\n`;

  if (fs.existsSync(memoryFile)) {
    const existing = fs.readFileSync(memoryFile, 'utf8');
    fs.writeFileSync(memoryFile, existing + '\n' + memoryEntry);
  } else {
    fs.writeFileSync(memoryFile, memoryEntry);
  }

  console.log(`✅ Added to daily memory: ${memoryFile}`);

  // Summary for notification
  const summary = `
📊 **Daily Crypto Trading Report - ${date}**

💰 Portfolio: $${portfolio.currentBalance} (${portfolio.growthPercent >= 0 ? '+' : ''}${portfolio.growthPercent}%)
📈 Trades: ${portfolio.trades}
✅ Win Rate: ${portfolio.winRate}
🎯 Profit Factor: ${report.includes('Profit Factor') ? report.split('Profit Factor: ')[1].split('\n')[0].trim() : 'N/A'}
${portfolio.growth >= 0 ? '🟢' : '🔴'} Today's Growth: ${portfolio.growth >= 0 ? '+' : ''}$${portfolio.growth}

Full report saved to workspace.
`;

  console.log('\n' + summary);

  console.log('\n✅ Daily analytics report complete!');
  return summary;
}

// Run if executed directly
if (require.main === module) {
  generateDailyReport()
    .then(summary => console.log('\nSummary ready for Telegram notification'))
    .catch(err => console.error('❌ Error:', err.message));
}

module.exports = generateDailyReport;