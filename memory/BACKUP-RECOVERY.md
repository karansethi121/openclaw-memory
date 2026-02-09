# OpenClaw Backup & Recovery System

## 📦 Overview

Automated backup and recovery system to prevent data loss and ensure business continuity.

---

## 🔄 What Gets Backed Up

### Memory Files
- `memory/YYYY-MM-DD.md` - Daily notes and logs
- `MEMORY.md` - Long-term curated memories

### Sessions
- `agents/main/sessions/*.jsonl` - All conversation history
- `agents/main/sessions/sessions.json` - Session index

### Configuration
- `openclaw.json` - Main OpenClaw configuration

### Workspace
- `one4health-website/` - Complete website files
- `research/` - Competitor research and analysis
- `brand/` - Logo and brand assets
- `IDENTITY.md`, `SOUL.md`, `USER.md` - Core identity files

---

## 🕐 Backup Schedule (Cron Jobs)

### Daily Backup - 2:00 AM
- **Frequency:** Every day at 2:00 AM
- **Retention:** 30 days
- **Location:** `~/.openclaw/backups/backup_YYYY-MM-DD_HH-MM-SS.zip`

### Gateway Health Check - Every Hour
- **Frequency:** Every hour
- **Action:** Checks if gateway is running, auto-restarts if down
- **Log:** `~/.openclaw/backups/gateway-health.log`

---

## 🛠️ Manual Backup

### Linux/Mac
```bash
cd ~/.openclaw/scripts
bash backup-daily.sh
```

### Windows
```cmd
cd %USERPROFILE%\.openclaw\scripts
backup-daily.bat
```

---

## 🔧 Manual Recovery

### Linux/Mac
```bash
cd ~/.openclaw/scripts

# Restore latest backup
bash recover-backup.sh latest

# Restore specific backup
bash recover-backup.sh backup_2026-02-03_08-00-00.tar.gz
```

### Windows
```cmd
REM Unzip the backup file manually
cd %USERPROFILE%\.openclaw\backups
REM Extract backup_YYYY-MM-DD_HH-MM-SS.zip to recover files

REM Then restart gateway
openclaw gateway restart
```

---

## 🔍 Check Backup Status

### View All Backups
```bash
# Linux/Mac
ls -lht ~/.openclaw/backups/backup_*.tar.gz

# Windows
dir %USERPROFILE%\.openclaw\backups\backup_*.zip /O-D
```

### View Backup Manifest
```bash
# Linux/Mac
cat ~/.openclaw/backups/backup_YYYY-MM-DD_HH-MM-ssh.tar.gz-extracted/MANIFEST.txt

# Windows
type %USERPROFILE%\.openclaw\backups\backup_YYYY-MM-DD_HH-MM-ssh\MANIFEST.txt
```

### View Health Logs
```bash
# Linux/Mac
cat ~/.openclaw/backups/gateway-health.log

# Windows
type %USERPROFILE%\.openclaw\backups\gateway-health.log
```

---

## 🚨 Emergency Recovery Steps

1. **Gateway Not Responding:**
   ```bash
   openclaw gateway status
   openclaw gateway restart
   ```

2. **Data Loss Detected:**
   - Navigate to `~/.openclaw/backups/`
   - Find most recent backup
   - Use recovery script to restore
   - Restart gateway

3. **Complete Reinstall Needed:**
   - Back up current config: `cp ~/.openclaw/openclaw.json ~/openclaw-config-backup.json`
   - Reinstall OpenClaw
   - Restore from backup
   - Restore config manually

---

## 🔐 Backup Locations

| Type | Location |
|------|----------|
| Daily Backups | `~/.openclaw/backups/backup_*.zip` |
| Health Log | `~/.openclaw/backups/gateway-health.log` |
| Backup Scripts | `~/.openclaw/scripts/backup-daily.*` |
| Recovery Scripts | `~/.openclaw/scripts/recover-backup.*` |
| Health Scripts | `~/.openclaw/scripts/gateway-health.*` |

---

## ⚙️ Configuration

### Change Backup Schedule
Edit the cron job using:
```bash
openclaw cron list          # List all cron jobs
openclaw cron update <id>   # Update specific job
```

### Change Retention Period
Edit the backup script:
- Linux/Mac: `find "$BACKUP_DIR" -mtime +30 -delete`
- Windows: `forfiles /D -30`

### Change Backup Directory
Edit the `BACKUP_DIR` variable in backup scripts.

---

## 📊 Backup Size Estimates

| Content | Approx. Size |
|---------|--------------|
| Memory files | 1-5 MB |
| Sessions | 10-50 MB (depends on conversation volume) |
| Config | 5 KB |
| Website | 5-10 MB |
| Research | 1-5 MB |
| Brand | 500 KB |
| **Total (compressed)** | ~15-25 MB per backup |

With 30-day retention: ~450-750 MB total

---

## ✅ Health Check Status

Run gateway health check manually:
```bash
cd ~/.openclaw/scripts
bash gateway-health.sh  # Linux/Mac
gateway-health.bat      # Windows
```

---

## 📞 Support

For backup/recovery issues:
1. Check health logs for errors
2. Verify backup files exist in expected location
3. Ensure sufficient disk space
4. Check file permissions

---

**Last Updated:** 2026-02-03
**Version:** 1.0