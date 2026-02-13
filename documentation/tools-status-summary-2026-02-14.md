# Tools Status Summary - 2026-02-14

**Last Updated:** 2026-02-14 @ 01:30 AM IST

---

## ✅ Working Tools

| Tool | Status | Notes |
|------|--------|-------|
| `exec` | ✅ Works | Execute shell commands, PowerShell |
| `process` | ✅ Works | Manage background exec sessions |
| `read` | ✅ Works | Read files (text, images) |
| `write` | ✅ Works | Create/overwrite files |
| `edit` | ✅ Works | Precise file edits |
| `web_search` | ❌ Blocked | Invalid BRAVE_API_KEY |
| `web_fetch` | ✅ Works | Direct URL fetching (markdown/text) |
| `browser` | ⚠️ Partial | Chrome extension relay, needs tab attach |
| `canvas` | ⚠️ Partial | Requires node for eval/snapshot |
| `nodes` | ✅ Works | Control paired devices |
| `cron` | ✅ Works | Manage cron jobs, wake events |
| `message` | ✅ Works | Send messages, channel actions |
| `gateway` | ✅ Works | Restart, config, update |
| `sessions_list` | ✅ Works | List sessions |
| `sessions_history` | ✅ Works | Fetch session history |
| `sessions_send` | ✅ Works | Send inter-session messages |
| `sessions_spawn` | ✅ Works | Spawn sub-agents |
| `session_status` | ✅ Works | Show usage/time/cost |
| `memory_search` | ✅ Works | Search MEMORY.md + memory/*.md |
| `memory_get` | ✅ Works | Safe snippet read |
| `tts` | ✅ Works | Text-to-speech, returns MEDIA path |
| `agents_list` | ✅ Works | List allowed agents |

---

## ❌ Blocked Tools

| Tool | Issue | Workaround |
|------|-------|------------|
| `web_search` | Invalid BRAVE_API_KEY (422) | Use web_fetch with known URLs |
| `canvas.eval` | No node available | Use inline HTML for manual conversion |
| `canvas.snapshot` | No node available | Cannot snapshot canvas |

---

## 📊 Tool Categories

### **Core System**
- exec, process, read, write, edit
- All working ✅

### **Communication**
- message, sessions_send, sessions_spawn
- All working ✅

### **Web & API**
- web_search ❌, web_fetch ✅, browser ⚠️
- Mixed status

### **Memory & Search**
- memory_search, memory_get
- All working ✅

### **Automation**
- cron
- Working ✅

### **Media**
- tts ✅
- Working

### **Analytics**
- session_status
- Working ✅

---

## 🎯 Recommended Usage Patterns

### When web_search Blocked:
1. Ask user for specific URLs
2. Use `web_fetch` with `extractMode: "markdown"`
3. Parse extracted content for info
4. Use browser tool (when tab attached) for interactive content

### For Canvas:
1. Create HTML files with inline JavaScript
2. Provide to user to convert/preview
3. Use as reference for manual implementation

### For Voice Updates:
1. Use `tts` to generate audio
2. Use `message` with `media` path to send to Telegram
3. Good for longer updates or announcements

---

## 🔧 Configuration Notes

### Critical Env Vars:
- `BRAVE_API_KEY` - Invalid (2 keys tried)
- `BINANCE_API_KEY/SECRET` - Present (trading terminated)
- `MINIMAX_API_KEY` - Configured

### Git Configuration:
- Identity: karan@openclaw.ai / Karan Sethi
- Status: 27 commits ahead of origin

### Gateway Configuration:
- Port: 18789
- Mode: local / bind: loopback
- Auth: token-based

---

**Documented By:** OpenClaw Agent
**Purpose:** Quick reference for tool availability and workarounds