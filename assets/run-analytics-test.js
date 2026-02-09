// Analytics Test Runner - Test the analytics system
const AnalyticsCollector = require('./skills/analytics/analytics-collector.js');

console.log('🔄 Testing Analytics Collector...\n');

// Initialize collector
const collector = new AnalyticsCollector();

// Test 1: Log today's task completion
console.log('✅ Step 1: Logging today\'s completed tasks...');
collector.logTask('started'); // Task 1: Backup system
collector.logTask('started'); // Task 2: One4Health deployment
collector.logTask('started'); // Task 3: Prompt enhancer
collector.logTask('started'); // Task 4: Deployment auto-fixer

collector.logTask('completed'); // Backup system done
collector.logTask('completed'); // One4Health deployment done
collector.logTask('completed'); // Prompt enhancer done
collector.logTask('completed'); // Deployment auto-fixer done

console.log('Task completion rate:', collector.getCompletionRate(), '%\n');

// Test 2: Log quality scores
console.log('✅ Step 2: Logging quality scores...');
collector.logQualityScore(85); // Backup system
collector.logQualityScore(88); // One4Health deployment
collector.logQualityScore(82); // Prompt enhancer
collector.logQualityScore(90); // Deployment auto-fixer

console.log('Average quality score (7 days):', collector.getAverageQuality(7), '\n');

// Test 3: Log improvements
console.log('✅ Step 3: Logging improvements...');
collector.logImprovement('tasks'); // Completed 4 tasks
collector.logImprovement('docs'); // Created 6 documentation files
collector.logImprovement('skills'); // Working on skills discovery

console.log('Improvements:', collector.metrics.improvement, '\n');

// Test 4: Log skill usage
console.log('✅ Step 4: Logging skill usage...');
collector.logSkillUsage('github');
collector.logSkillUsage('skill-creator');
collector.logSkillUsage('summarize');
collector.logSkillUsage('analytics');

console.log('Skills used today:', collector.metrics.skillsUtilization.usedToday, '\n');

// Test 5: Generate summary
console.log('✅ Step 5: Generating metrics summary...\n');
const summary = collector.getSummary();
console.log(JSON.stringify(summary, null, 2));

// Test 6: Generate daily summary
console.log('\n✅ Step 6: Generating daily summary...\n');
const daily = collector.generateDailySummary();
console.log(JSON.stringify(daily, null, 2));

console.log('\n✨ Analytics collector working correctly!');
console.log('Data saved to: analytics-data.json');
console.log('Ready to display on Canvas with visualizations!');

module.exports = { collector, summary };