---
name: analytics
description: Track AI performance, quality metrics, task completion rates, skills utilization, and improvement trends. Collects metrics, generates charts with Chart.js, visualizes on Canvas, provides insights.
metadata:
  openclaw:
    emoji: "📊"
    category: analytics
---

# Analytics Plugin

Track my own performance, quality, and improvement over time.

## What It Tracks

**Quality Score (0-100):**
- Accuracy: Solved the problem? (30%)
- Conciseness: Not too long? (20%)
- Clarity: Understandable? (20%)
- Completeness: Nothing missing? (20%)
- Autonomy: Needed help? (10%)

**Task Completion:**
- Tasks started, completed, failed
- Completion rate %

**Skills Utilization:**
- Total skills: 49
- Skills enabled: N
- Skills used: N
- Utilization %

**Improvement Metrics:**
- Self-improvement tasks done
- New skills installed
- New agents created
- Documentation updated

## Commands

- **"Show analytics"** - Display all metrics on Canvas
- **"Quality score [0-100]"** - Log a quality score for last response
- **"Task completed"** - Log successful task completion
- **"Task failed"** - Log failed task
- **"Update improvement [type]"** - Increment improvement counter (tasks/skills/agents/docs)
- **"Generate analytics report"** - Full report with all charts

## Usage Examples

```
You: "Update quality score 85"
Me: Logging quality score of 85...

You: "Task completed"
Me: Logging task completion. Rate: 75%

You: "Show analytics"
Me: [Presents dashboard on Canvas with all metrics and charts]
```

## Output

Metrics displayed on Canvas with:
- Real-time current scores
- Charts showing trends
- Progress tracking
- Improvement insights

## Files Stored

- `analytics-data.json` - Raw metrics data
- `analytics-reports/` - Historical reports
- `analytics-charts/` - Generated charts

## Frequency

- **Manual:** Use commands anytime
- **Automatic:** Cron job every 6 hours collects metrics
- **Daily:** Full report generated at 8 PM