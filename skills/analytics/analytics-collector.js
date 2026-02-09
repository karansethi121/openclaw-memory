// Analytics Data Collector
// Tracks AI performance, quality, and improvement metrics

class AnalyticsCollector {
  constructor(dataPath = 'C:\\Users\\Karan\\.openclaw\\workspace\\analytics-data.json') {
    this.dataPath = dataPath;
    this.metrics = this.loadData();
  }

  // Load existing metrics or initialize
  loadData() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Initializing new analytics data:', error.message);
    }

    // Initialize with defaults
    return {
      qualityScores: [],
      taskCompletion: { completed: 0, failed: 0, total: 0 },
      skillsUtilization: {
        enabled: 12,
        total: 49,
        usedToday: [],
        usedThisWeek: []
      },
      improvement: {
        tasks: 0,
        skills: 0,
        agents: 0,
        docs: 0
      },
      memoryRetention: {
        tested: 0,
        correct: 0
      },
      dailySummaries: {},
      createdAt: new Date().toISOString()
    };
  }

  // Save metrics to file
  saveData() {
    const fs = require('fs');
    const dir = require('path').dirname(this.dataPath);
    
    // Ensure directory exists
    if (!require('fs').existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.metrics, null, 2));
  }

  // Log a quality score
  logQualityScore(score) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('Quality score must be a number between 0 and 100');
    }

    this.metrics.qualityScores.push({
      score,
      timestamp: new Date().toISOString()
    });

    // Keep only last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.metrics.qualityScores = this.metrics.qualityScores.filter(
      s => new Date(s.timestamp).getTime() > thirtyDaysAgo
    );

    this.saveData();
    return this.metrics.qualityScores.length;
  }

  // Log task completion
  logTask(type) {
    if (!['completed', 'failed', 'started'].includes(type)) {
      throw new Error('Task type must be: completed, failed, or started');
    }

    if (type === 'started') {
      this.metrics.taskCompletion.total++;
    } else {
      this.metrics.taskCompletion[type]++;
    }

    this.saveData();
    return this.getCompletionRate();
  }

  // Log improvement activity
  logImprovement(type) {
    if (!['tasks', 'skills', 'agents', 'docs'].includes(type)) {
      throw new Error('Improvement type must be: tasks, skills, agents, or docs');
    }

    this.metrics.improvement[type]++;
    this.saveData();
    return this.metrics.improvement;
  }

  // Log skill usage
  logSkillUsage(skillName) {
    if (!this.metrics.skillsUtilization.usedToday.includes(skillName)) {
      this.metrics.skillsUtilization.usedToday.push(skillName);
    }
    if (!this.metrics.skillsUtilization.usedThisWeek.includes(skillName)) {
      this.metrics.skillsUtilization.usedThisWeek.push(skillName);
    }
    this.saveData();
  }

  // Update retention score
  updateRetention(correct) {
    this.metrics.memoryRetention.tested++;
    if (correct) {
      this.metrics.memoryRetention.correct++;
    }
    this.saveData();
    return this.getRetentionRate();
  }

  // Get average quality score
  getAverageQuality(days = 7) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentScores = this.metrics.qualityScores.filter(
      s => new Date(s.timestamp).getTime() > cutoff
    );
    
    if (recentScores.length === 0) return 0;
    
    const sum = recentScores.reduce((a, b) => a + b.score, 0);
    return Math.round(sum / recentScores.length);
  }

  // Get completion rate
  getCompletionRate() {
    const { completed, total } = this.metrics.taskCompletion;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  // Get skill utilization rate
  getSkillUtilization() {
    const { enabled, total, usedThisWeek } = this.metrics.skillsUtilization;
    return {
      enabledPercent: Math.round((enabled / total) * 100),
      activePercent: Math.round((usedThisWeek.length / total) * 100),
      usedCount: usedThisWeek.length
    };
  }

  // Get retention rate
  getRetentionRate() {
    const { tested, correct } = this.metrics.memoryRetention;
    return tested === 0 ? 0 : Math.round((correct / tested) * 100);
  }

  // Get daily metrics for summary
  getDailyMetrics(date = new Date().toISOString().split('T')[0]) {
    return this.metrics.dailySummaries[date] || null;
  }

  // Generate daily summary
  generateDailySummary() {
    const today = new Date().toISOString().split('T')[0];
    const summary = {
      date: today,
      qualityScore: this.getAverageQuality(1),
      taskCompletionRate: this.getCompletionRate(),
      skillUtilization: this.getSkillUtilization(),
      retentionRate: this.getRetentionRate(),
      improvementsToday: {
        tasks: 0,
        skills: 0,
        agents: 0,
        docs: 0
      }
    };

    this.metrics.dailySummaries[today] = summary;
    this.saveData();
    return summary;
  }

  // Export all data
  exportData() {
    return JSON.stringify(this.metrics, null, 2);
  }

  // Get metrics summary
  getSummary() {
    return {
      quality: {
        average7Days: this.getAverageQuality(7),
        average30Days: this.getAverageQuality(30),
        trend: this.calculateTrend('quality')
      },
      tasks: {
        completionRate: this.getCompletionRate(),
        completed: this.metrics.taskCompletion.completed,
        failed: this.metrics.taskCompletion.failed,
        total: this.metrics.taskCompletion.total
      },
      skills: this.getSkillUtilization(),
      improvement: this.metrics.improvement,
      memory: {
        retentionRate: this.getRetentionRate(),
        tested: this.metrics.memoryRetention.tested
      }
    };
  }

  // Calculate trend (improving, stable, declining)
  calculateTrend(type) {
    if (this.metrics.qualityScores.length < 2) return 'insufficient_data';

    const recent = this.getAverageQuality(3);
    const older = this.getAverageQuality(7);

    if (recent > older + 5) return 'improving';
    if (recent < older - 5) return 'declining';
    return 'stable';
  }
}

module.exports = AnalyticsCollector;