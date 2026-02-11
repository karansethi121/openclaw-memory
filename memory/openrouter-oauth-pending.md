
---

## 🎯 Pending Task: OpenRouter OAuth Integration (2026-02-11)

**User Request:** "Connect OpenClaw with OpenRouter using OAuth"

**Status:** Not started / Queued
**Priority:** Medium

**What's Needed:**
- Configure OpenRouter as OAuth provider in openclaw.json
- Add OpenRouter model provider configuration
- Add OAuth profile for openrouter
- Restart gateway to apply changes
- Test connection

**Notes:**
- User specifically requested OAuth authentication (not API key)
- Integration pattern similar to MiniMax OAuth setup
- OpenRouter provides access to multiple AI models:
  - Claude 3.5 Sonnet / Haiku / Opus
  - GPT-4o / GPT-4o Mini
  - DeepSeek V3 / R1
  - Llama 3.2
  - And many more

---

## ✅ Model Inventory (Updated 2026-02-11)

### Ollama (Local, Free)
- ✅ glm-4.7:cloud (alias: chat) - Default primary model
- ✅ deepseek-coder:latest (alias: coder) - For coding tasks
- ✅ deepseek-r1:latest - Reasoning model (5.2 GB)
- ✅ phi3:mini (alias: mini) - Lightweight for quick tasks
- 🔄 qwen2.5:latest - Downloading (4.7 GB, 8% complete)

### MiniMax (API, OAuth)
- ⚠️ minimax/MiniMax-M2.1 - Configured but insufficient balance (error 1008)
  - 200K context window
  - Reasoning capability: true
  - Cost: input 15, output 60 per 1M tokens

### Google Anti-Gravity (OAuth)
- ✅ google-antigravity/claude-opus-4-5-thinking - Configured

### OpenRouter (Pending)
- ❌ Not yet configured
- OAuth integration requested by user