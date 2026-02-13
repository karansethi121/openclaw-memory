# OpenClaw System Monitor App

**Created:** 2026-02-13 07:30 AM IST
**Updated:** 2026-02-13 11:30 AM IST (fixed for inline loading)
**Purpose:** Canvas OS system monitoring dashboard

## App Details

| Property | Value |
|----------|-------|
| **App Name** | System Monitor |
| **Location** | `apps/system-monitor/` |
| **Tech Stack** | Pure HTML/CSS/JS (no dependencies) |

## Features

- Gateway status indicator (Online/Offline)
- Active cron jobs count
- Git commits today
- Uptime tracking
- System performance metrics (model, channel, status)

## Usage Methods

### Method 1: Direct HTML File
Open `index.html` in browser for static preview.

### Method 2: Inline Injection (No HTTP Server Required!)
Load directly via Canvas OS without Python:

```javascript
canvas.eval javaScript="<paste inline-version.js contents>"
```

Or use data URL:
```
data:text/html,<paste inline-version.js html+css+js>
```

### Method 3: Server (if Python available)
```bash
cd apps/system-monitor && python3 -m http.server 9880
# Then present: http://localhost:9880
```

## Canvas OS API Pattern

```javascript
window.app = {
  setValue: (key, val) => { /* Update single element */ },
  loadData: (data) => { /* Bulk update from cron/system data */ },
  notify: (msg) => { /* Log to console */ }
};
```

## Update Data Example

```javascript
app.loadData({
  gateway: true,
  cronCount: 10,
  gitCommits: 9,
  uptime: '7h 32m',
  model: 'deepseek-coder',
  channel: 'main'
});
```

## Files Created

- `index.html` - Static dashboard preview
- `inline-version.js` - No-server injection ready
- `app-info.md` - This documentation

## Next Steps

- [x] Works inline without HTTP server
- [ ] Connect to cron API for real-time data
- [ ] Present on OpenClaw Canvas