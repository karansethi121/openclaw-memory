# OpenClaw Memory Repository

---

**Purpose:** Permanent backup of OpenClaw AI's memory, knowledge, and brain.

---

## 📚 What's Stored Here

### 1. Long-Term Memory
- **MEMORY.md** - Curated knowledge that persists across sessions
  - Critical user preferences
  - Project decisions
  - Technical preferences
  - Learned lessons

### 2. Daily Memory Logs
- **memory/YYYY-MM-DD.md** - Daily notes from each session
  - What happened
  - Decisions made
  - Progress updates
  - Context for future sessions

---

## 🔄 How It Works

1. **Daily at 2 AM India Time:**
   - OpenClaw wakes up via cron job
   - Runs `backup-daily.bat` script
   - Creates local backup (zip file)
   - **Automatically pushes memory to GitHub**

2. **Manual Push:**
   ```bash
   C:\Users\Karan\.openclaw\scripts\memory-git-push.bat
   ```

---

## 📁 File Structure

```
├── MEMORY.md                      # Long-term curated knowledge
├── memory/                        # Daily session notes
│   ├── 2026-02-04.md             # Session logs
│   ├── 2026-02-05.md             # (future)
│   └── ...
└── README.md                      # This file
```

---

## 🧠 About OpenClaw Memory

OpenClaw is an AI assistant that learns from interactions. This repository stores:

- **User preferences** - How to interact, what to do automatically
- **Project context** - All projects, decisions, progress
- **Technical knowledge** - Tools, configs, lessons learned
- **Daily logs** - What happened each session

---

## 🔒 Privacy

This repository contains personal AI memory. It's public for accessibility
but contains only work-related content (projects, tools, decisions).
No private data is stored.

---

## 📅 Last Updated

Automatically updated daily via cron job.

---

*Repository created: 2026-02-04*
*OpenClaw AI Assistant Memory Backup*