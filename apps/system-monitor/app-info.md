# OpenClaw System Monitor App

**Created:** 2026-02-13 07:30 AM IST
**Purpose:** Canvas OS system monitoring dashboard

## App Details

| Property | Value |
|----------|-------|
| **App Name** | System Monitor |
| **Port** | 9880 |
| **Location** | `apps/system-monitor/` |
| **Tech Stack** | HTML, CSS, JavaScript, Chart.js |

## Features

- Gateway status indicator
- Active cron jobs count
- Git commits today
- Uptime tracking
- System performance metrics
- Cron jobs list view

## Canvas OS Integration

**API Pattern:**
```javascript
window.app = {
  setValue: (key, val) => { /* Update single value */ },
  loadData: (data) => { /* Update all data */ },
  notify: (msg) => { /* Log notifications */ }
};
```

## Usage

1. Start HTTP server: `python3 -m http.server 9880`
2. Present on Canvas: `canvas action=present target=node node=<node-id> url=http://localhost:9880`
3. Update via JS: `canvas.eval javaScript="app.loadData({gateway: true, cronCount: 10})"`

## Files Created

- `index.html` - Main dashboard app
- `app-info.md` - This documentation

## Next Steps

- [ ] Connect to actual system API for real-time data
- [ ] Add Chart.js visualizations for metrics
- [ ] Present on OpenClaw canvas
- [ ] Test live updates via canvas.eval