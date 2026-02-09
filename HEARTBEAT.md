# HEARTBEAT.md
# Periodic checks during the day (rotate through these 2-4 times)

## IMPORTANT - TRADING TERMINATED
- **Trading services are DISABLED** (user requested - 2026-02-09)
- Do NOT check or report trading bot status
- All trading cron jobs deleted (HFT, entry detector, consolidation, etc.)
- Only system monitoring jobs remain active

## Gateway Status
- Check if OpenClaw gateway is responding (http://127.0.0.1:18789)
- Send alert if down for > 5 minutes

## Cron Jobs
- Check recent cron job results (via `cron runs` if needed)
- Only check: Gateway Health Check, Git Auto-Commit, Daily Backup, etc.
- DO NOT check trading jobs (they are deleted)
- Alert if any jobs failed
- Note last successful run timestamps

## Git Status
- Check if there are uncommitted changes in workspace
- Note if git-auto-commit is running and making commits
- Alert if repo has diverged from origin

## Website Health
- Quick check of one4health.netlify.app HTTP status
- Alert if site is down (non-200 response)

## Weather Check
- Check weather for key Indian cities (Delhi, Mumbai, Bangalore)
- Rotate through cities daily
- Alert for extreme weather (alerts coming up)
- Location: C:\Users\Karan\.openclaw\workspace\scripts\check-weather.ps1

## Notifications
- Send Telegram update only if:
  - Something is wrong/unusual
  - It's been > 8 hours since last message
  - Important overnight work completed

 Otherwise reply: HEARTBEAT_OK
