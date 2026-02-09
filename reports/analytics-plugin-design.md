# Analytics Plugin - Custom OpenClaw Skill
*Track AI performance, improvement metrics, and quality trends*

---

## 📊 ANALYTICS PLUGIN OVERVIEW

**Purpose:** Track my own performance, improvement, and quality over time

**What it tracks:**
- Response quality scores
- Task completion rates
- Skills utilization
- Improvement trends
- Memory retention

**Outputs:**
- Real-time metrics
- Chart visualizations (Chart.js)
- Canvas dashboard presentation
- Trends over time

---

## 📁 FILE STRUCTURE

```
C:\Users\Karan\.openclaw\workspace\
├── skills\
│   └── analytics-plugin\
│       ├── SKILL.md              (skill definition)
│       ├── analytics.js          (core logic)
│       ├── metrics-collector.js  (data collection)
│       └── charts-generator.js   (visualization)
└── analytics-dashboard.html      (Canvas presentation)
```

---

## 🎯 METICS TO TRACK

### 1. Quality Score (0-100)
**Factors:**
- Accuracy: Solved the problem? (30%)
- Conciseness: Not too long? (20%)
- Clarity: Understandable? (20%)
- Completeness: Nothing missing? (20%)
- Autonomy: Needed help? (10%)

### 2. Task Completion
- Tasks started
- Tasks completed
- Failed tasks
- Completion rate %

### 3. Skills Utilization
- Total skills: 49
- Skills enabled: N
- Skills used today: N
- Utilization %: (used/total) * 100

### 4. Improvement Metrics
- Self-improvement tasks done
- New skills installed
- New agents created
- Documentation updated

### 5. Memory Retention
- MEMORY.md items tested
- Correctly remembered: N
- Retention %: (correct/total) * 100

---

## 📊 CHARTS TO GENERATE

### Chart 1: Quality Trend (Line Chart)
- X-axis: Time (daily)
- Y-axis: Quality score (0-100)
- Show improvement over time

### Chart 2: Skills Utilization (Doughnut Chart)
- Used skills
- Unused skills
- Show skill utilization rate

### Chart 3: Improvement Progress (Bar Chart)
- Self-improvement tasks done
- New skills installed
- New agents created
- Documentation updated

### Chart 4: Task Completion (Pie Chart)
- Completed
- Failed
- In progress

---

## 🔧 IMPLEMENTATION

### File 1: SKILL.md
```markdown
---
name: analytics
description: Track AI performance, quality metrics, and improvement trends. Collects metrics, generates charts, visualizes on Canvas.
metadata:
  openclaw:
    emoji: "📊"
    category: analytics
---

# Analytics Plugin

Track my own performance and improvement.

## Commands
- "Show analytics" - Display all metrics
- "Update quality score [score]" - Log a quality score
- "Track task [completed/failed]" - Log task status
- "Generate analytics report" - Full report with charts
```

### File 2: analytics-data.js (Data Collection)
```javascript
// Collect and store analytics data
class AnalyticsCollector {
  constructor() {
    this.metrics = {
      qualityScores: [],
      taskCompletion: { completed: 0, failed: 0, total: 0 },
      skillsUtilization: { enabled: 12, total: 49, used: [] },
      improvement: { tasks: 0, skills: 0, agents: 0, docs: 0 },
      memoryRetention: { tested: 0, correct: 0 }
    };
  }

  logQualityScore(score) {
    this.metrics.qualityScores.push({
      score,
      timestamp: Date.now()
    });
  }

  logTask(type) {
    this.metrics.taskCompletion[type]++;
    this.metrics.taskCompletion.total++;
  }

  getAverageQuality() {
    if (this.metrics.qualityScores.length === 0) return 0;
    const sum = this.metrics.qualityScores.reduce((a, b) => a + b.score, 0);
    return Math.round(sum / this.metrics.qualityScores.length);
  }

  getCompletionRate() {
    const { completed, total } = this.metrics.taskCompletion;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  getSkillUtilization() {
    const { enabled, total } = this.metrics.skillsUtilization;
    return Math.round((enabled / total) * 100);
  }

  exportData() {
    return JSON.stringify(this.metrics, null, 2);
  }
}
```

### File 3: charts-generator.js (Visualization)
```javascript
// Generate charts using Chart.js
class ChartGenerator {
  constructor(metrics) {
    this.metrics = metrics;
  }

  generateQualityTrend() {
    return {
      type: 'line',
      data: {
        labels: this.metrics.qualityScores.map(s => new Date(s.timestamp).toLocaleDateString()),
        datasets: [{
          label: 'Quality Score',
          data: this.metrics.qualityScores.map(s => s.score),
          borderColor: '#2E7D32',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        scales: { y: { min: 0, max: 100 } }
      }
    };
  }

  generateSkillUtilization() {
    const { enabled, total } = this.metrics.skillsUtilization;
    return {
      type: 'doughnut',
      data: {
        labels: ['Enabled Skills', 'Unused Skills'],
        datasets: [{
          data: [enabled, total - enabled],
          backgroundColor: ['#2E7D32', '#E0E0E0']
        }]
      }
    };
  }

  generateImprovementProgress() {
    const { improvement } = this.metrics;
    return {
      type: 'bar',
      data: {
        labels: ['Tasks', 'Skills', 'Agents', 'Docs'],
        datasets: [{
          label: 'Improvements',
          data: [improvement.tasks, improvement.skills, improvement.agents, improvement.docs],
          backgroundColor: ['#2E7D32', '#C9A227', '#1A237E', '#4CAF50']
        }]
      }
    };
  }

  generateTaskCompletion() {
    const { completed, failed } = this.metrics.taskCompletion;
    return {
      type: 'pie',
      data: {
        labels: ['Completed', 'Failed'],
        datasets: [{
          data: [completed, failed],
          backgroundColor: ['#10B981', '#EF4444']
        }]
      }
    };
  }
}
```

### File 4: analytics-dashboard.html (Canvas Presentation)
```html
<!DOCTYPE html>
<html>
<head><title>Analytics Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head>
<body>
  <h1>📊 AI Analytics Dashboard</h1>
  <div class="metrics">
    <div class="metric">
      <h3>Quality Score</h3>
      <div class="value" id="quality-score">-</div>
    </div>
    <div class="metric">
      <h3>Task Completion</h3>
      <div class="value" id="completion-rate">-</div>
    </div>
    <div class="metric">
      <h3>Skill Utilization</h3>
      <div class="value" id="skill-utilization">-</div>
    </div>
  </div>
  <div class="charts">
    <canvas id="qualityChart"></canvas>
    <canvas idskillChart></canvas>
    <canvas id="improvementChart"></canvas>
    <canvas id="taskChart"></canvas>
  </div>
</body>
</html>
```

---

## 🎯 USAGE

### Command: "Show analytics"
1. Load analytics data
2. Calculate metrics
3. Generate charts
4. Present on Canvas

### Command: "Update quality score 85"
1. Parse score (0-100)
2. Log to qualityScores array
3. Update data file

### Command: "Track task completed"
1. Increment completion counter
2. Update completion rate

---

## 📈 ANALYTICS CRON JOB (AUTO-RUN)

**Schedule:** Every 6 hours
**Task:**
- Collect current metrics
- Generate charts
- Save to memory/YYYY-MM-DD.md
- Present summary on Canvas

---

*Analytics Plugin Design: 2026-02-05*
*Status: Planning → Implementation*