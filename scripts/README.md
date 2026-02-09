# OpenClaw Scripts

This directory contains utility scripts for OpenClaw backup, recovery, and health monitoring.

## 📁 Available Scripts

### Backup Scripts
- **`backup-daily.sh`** - Linux/Mac daily backup script
- **`backup-daily.bat`** - Windows daily backup script

### Recovery Scripts
- **`recover-backup.sh`** - Linux/Mac backup recovery script

### Health Scripts
- **`gateway-health.sh`** - Linux/Mac gateway health check & recovery
- **`gateway-health.bat`** - Windows gateway health check & recovery

---

## 🚀 Quick Start

### Manual Backup
```bash
# Windows
backup-daily.bat

# Linux/Mac
bash backup-daily.sh
```

### Manual Recovery
```bash
# Windows - Manually extract backup file
# Linux/Mac
bash recover-backup.sh latest
```

### Gateway Health Check
```bash
# Windows
gateway-health.bat

# Linux/Mac
bash gateway-health.sh
```

---

## 📋 Backup Contents

All scripts backup:
- ✅ Memory files (daily notes + long-term memory)
- ✅ Sessions (all conversation history)
- ✅ Configuration (openclaw.json)
- ✅ Workspace (website, research, brand assets)
- ✅ Identity files (SOUL.md, USER.md, IDENTITY.md)

---

## 🕐 Automation

### Daily Backup
- **Schedule:** 2:00 AM daily (Asia/Kolkata)
- **Retention:** 30 days
- **Location:** `~/.openclaw/backups/backup_*.zip`

### Gateway Health Check
- **Schedule:** Every hour
- **Action:** Auto-restart if gateway is down
- **Log:** `~/.openclaw/backups/gateway-health.log`

---

## 📖 Documentation

Full documentation available at: `../memory/BACKUP-RECOVERY.md`

---

## ⚠️ Important Notes

- Scripts are platform-specific (Windows .bat vs Linux/Mac .sh)
- Run scripts from their directory or use full paths
- For Windows, ensure openclaw command is in PATH
- Backup files are compressed automatically
- Old backups (older than 30 days) are automatically cleaned up

---

**Created:** 2026-02-03
**Status:** Active ✅