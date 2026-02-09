# Analytics Cron Job Configuration

## Purpose
Automatically collect and track AI performance metrics every 6 hours

---

## Cron Job: analytics-collect

**Schedule:** Every 6 hours (4x daily)
**Timezones:** India (IST)
**Model:** glm-4.7:cloud (lightweight, fast)

---

## Configuration

```json
{
  "name": "analytics-collect",
  "schedule": {
    "kind": "every",
    "everyMs": 21600000,
    "anchorMs": 1704466200000
  },
  "payload": {
    "kind": "agentTurn",
    "message": "Run the daily analytics collection and update metrics. Execute run-analytics-test.js and report quality scores, task completion rate, and skill utilization.",
    "model": "ollama/glm-4.7:cloud"
  },
  "sessionTarget": "isolated",
  "enabled": true
}
```

**Timing (IST):**
- 6:00 AM (daily start)
- 12:00 PM (mid-day check)
- 6:00 PM (evening check)
- 12:00 AM (nightly summary)

---

## Cron Job: analytics-daily-report

**Schedule:** Daily at 8 PM IST
**Purpose:** Generate detailed daily report with trends

```json
{
  "name": "analytics-daily-report",
  "schedule": {
    "kind": "cron",
    "expr": "0 20 * * *",
    "tz": "Asia/Kolkata"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "Generate daily analytics report. Read analytics-data.json, create summary, identify trends, and send to Telegram with key metrics.",
    "model": "ollama/glm-4.7:cloud"
  },
  "sessionTarget": "isolated",
  "enabled": true
}
```

---

## Action Commands

### Add Cron Jobs:
```bash
openclaw cron add --file analytics-cron-config.json
```

### List Cron Jobs:
```bash
openclaw cron list
```

### Test Cron Job:
```bash
openclaw cron run analytics-collect
```

---

## Expected Behavior

### Every 6 Hours:
1. Run analytics collector
2. Log quality scores for recent tasks
3. Track completion rate
4. Update skill usage
5. Save to analytics-data.json

### Daily at 8 PM:
1. Read yesterday's data
2. Calculate trends
3. Generate summary
4. Send to Telegram (key highlights)

---

## Metrics Collected

### Quality:
- Average score (7-day, 30-day)
- Trend (improving, stable, declining)
- Individual task scores

### Tasks:
- Completion rate
- Completed vs failed
- Total tasks started

### Skills:
- Utilization rate
- Skills enabled
- Active skills count

### Improvement:
- Tasks completed
- Skills added
- Agents created
- Docs updated

---

## Notifications

Only send Telegram notifications when:
- Quality score drops below 75%
- Task completion rate below 80%
- New milestone reached

Otherwise, data collection runs silently in background.

---

## Storage

**Data File:** `analytics-data.json`
- Contains 30-day history
- Auto-purges old data
- JSON format for easy analysis

---

**Ready to deploy cron jobs for automated analytics!** 🚀