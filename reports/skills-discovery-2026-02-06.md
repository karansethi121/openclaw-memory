# Skills Discovery - 2026-02-06
*Autonomous skill research and evaluation*

---

## Current Status: 7/52 Skills Enabled

### Currently Enabled ✅
1. **bluebubbles** - BlueBumbles external channel plugin
2. **github** - GitHub CLI interaction (issues, PRs, CI runs)
3. **skill-creator** - Create AgentSkills
4. **summarize** - Summarize URLs/files (web, PDFs, images, audio, YouTube)
5. **video-frames** - Extract frames from videos using ffmpeg
6. **analytics** - Track AI performance, metrics, Chart.js, Canvas visualization
7. **cron-scheduling** - Schedule tasks with cron and systemd timers

---

## Skills Evaluated

### 🌟 HIGH PRIORITY: weather ⭐

**Ease of Integration:** ⭐⭐⭐⭐⭐ (Easiest)
**Requirements:** curl (✅ Already available)
**API Key:** ❌ None needed
**Installation:** None required

**What it does:**
- Current weather and forecasts
- Uses wttr.in (free, no API key)
- Fallback: Open-Meteo JSON API

**Example commands:**
```bash
# Compact format
curl -s "wttr.in/Delhi?format=3"
# Output: Delhi: ⛅️ +8°C

# Full forecast
curl -s "wttr.in/Delhi?T"

# JSON via Open-Meteo
curl -s "https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=77.2&current_weather=true"
```

**Use Cases for One4Health:**
- Weather-based marketing (seasonal gummies)
- Delivery planning for orders
- Business trip planning

**Recommendation:** ✅ **ENABLE IMMEDIATELY** - Add to HEARTBEAT.md checks

---

### 🗣️ MEDIUM PRIORITY: sag (ElevenLabs TTS)

**Ease of Integration:** ⭐⭐ (Moderate)
**Requirements:** ELEVENLABS_API_KEY, sag CLI (brew install)
**API Key:** ✅ Required
**Installation:** macOS only (brew)

**What it does:**
- Text-to-speech with ElevenLabs
- Voice character tags (whispers, shouts, sings, laughs, etc.)
- Multiple voice models (v3 expressive, v2 stable, flash fast)

**Example commands:**
```bash
sag "Hello there"
sag speak -v "Roger" "Hello"
sag voices

# Generate audio file
sag -v Clawd -o /tmp/voice-reply.mp3 "Your message here"
```

**Barriers:**
- Requires ElevenLabs API key (paid service)
- macOS-only (brew install)
- Not compatible with Windows

**Recommendation:** ❌ **SKIP** - Platform mismatch (Windows system)

---

### 📧 MEDIUM PRIORITY: himalaya (Email CLI)

**Ease of Integration:** ⭐⭐ (Moderate)
**Requirements:** himalaya CLI, IMAP/SMTP config
**API Key:** ❌ None needed (username/password)
**Installation:** brew + manual config setup

**What it does:**
- Email management via IMAP/SMTP
- List, read, write, reply, forward, search emails
- Multiple accounts supported

**Configuration required:**
```toml
[accounts.personal]
email = "you@example.com"
display-name = "Your Name"

backend.type = "imap"
backend.host = "imap.example.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "you@example.com"
backend.auth.type = "password"
```

**Example commands:**
```bash
himalaya envelope list
himalaya message read 42
himalaya message reply 42
himalaya message write
```

**Barriers:**
- Requires manual IMAP/SMTP configuration
- brew install (macOS)
- Password management for auth

**Recommendation:** ⚠️ **DEFER** - Manual setup required

---

### 🎮 MEDIUM PRIORITY: gog (Google Workspace)

**Ease of Integration:** ⭐ (Difficult)
**Requirements:** gog CLI, Google Cloud OAuth
**API Key:** ❌ None (OAuth flow)
**Installation:** brew + Google Cloud project setup

**What it does:**
- Gmail, Calendar, Drive, Contacts, Sheets, Docs
- Full Google Workspace automation

**OAuth Setup:**
```bash
gog auth credentials /path/to/client_secret.json
gog auth add you@gmail.com --services gmail,calendar,drive,contacts,docs,sheets
```

**Example commands:**
```bash
gog gmail search 'newer_than:7d' --max 10
gog calendar events <calendarId> --from <iso> --to <iso>
gog drive search "query" --max 10
gog sheets get <sheetId> "Tab!A1:D10" --json
```

**Barriers:**
- Requires Google Cloud client_secret.json
- Complex OAuth setup
- brew install (macOS)

**Recommendation:** ❌ **SKIP** - Too complex for now

---

## Other Skills Noted

| Skill | Description | Priority | Notes |
|-------|-------------|----------|-------|
| 1password | Password management | Low | macOS only |
| bird | Twitter/X CLI | Low | Cookie-based auth |
| blogwatcher | Blog/RSS monitoring | Medium | Could be useful |
| camsnap | RTSP/ONVIF cameras | Medium | Hardware needed |
| coding-agent | Run Codex/Claude Code | Low | Not needed (have coder model) |
| notion | Notion API | Medium | If using Notion |
| obsidian | Obsidian vault automation | Medium | If using Obsidian |
| sherpa-onnx-tts | Local TTS (offline) | Medium | Cross-platform |
| slack | Slack control | Medium | If using Slack |

---

## Recommended Actions

### Immediate (Today):
1. ✅ Add **weather** to HEARTBEAT.md checks
2. ✅ Create weather check script
3. ✅ Test weather in heartbeat cycle

### This Week:
1. 📧 Research himalaya email setup automation
2. 💬 Check if using Slack - enable slack skill
3. 📝 Review notion/obsidian skill if using either

### This Month:
1. 🗣️ Consider sherpa-onnx-tts (cross-platform, offline)
2. 📰 Enable blogwatcher for competitor monitoring
3. 📸 Set up camsnap if cameras available

---

## Skill利用率 Goal

**Current:** 7/52 (13%)
**Target:** 25/52 (50%)
**Gap:** 18 more skills to enable

**Quick wins (easy to enable):**
1. weather ⭐⭐⭐⭐⭐ (no install, no key)
2. blogwatcher (blog monitoring)
3. openai-whisper-api (speech-to-text)
4. slack (if using Slack)

---

**Date:** 2026-02-06
**Next Review:** 2026-02-08