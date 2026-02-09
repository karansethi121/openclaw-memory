# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Memory Backup Scripts

### GitHub Memory Repository
**Repository:** https://github.com/karansethi121/openclaw-memory.git
**Purpose:** Automatic daily backup of all memory files to GitHub

**Scripts:**
- `C:\Users\Karan\.openclaw\scripts\memory-git-push.bat` - Push memory to GitHub
- `C:\Users\Karan\.openclaw\scripts\backup-daily.bat` - Daily backup (includes GitHub push)

**Setup:** (One-time completed 2026-02-04)
1. GitHub CLI authenticated: `gh auth login`
2. Repository created: `gh repo create openclaw-memory --public`
3. Auto-push configured in daily backup

**What Gets Backed Up:**
- `memory/` folder (daily notes by date)
- `MEMORY.md` (long-term knowledge)
- All memory files with timestamps

**Schedule:** Daily at 2 AM India Time via cron job

---

Add whatever helps you do your job. This is your cheat sheet.
