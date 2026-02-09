# USER.md - About Your Human

*Learn about the person you're helping. Update this as you go.*

- **Name:** Karan Sethi
- **What to call them:** Karan
- **Timezone:** India (IST) - *Note: Using VPN that shows UK, but actual location is India*
- **Notes:** 

## Context

### Projects

**One4Health**
- Gummy wellness brand based in India
- Currently building and redesigning the website
- Website at: https://one4health.netlify.app/
- Shift from Ashwagandha-focused to brand-focused
- Need to complete homepage repositioning

### Technical Setup
- Running OpenClaw with nightly autonomous work via cron jobs
- Multi-model system with automatic selection:

  **Model Selection Rule:**
  - 🤖 **Chat/Conversation** → glm-4.7:cloud (lighter, faster for quick replies)
  - 💻 **Coding/Building/Creating** → deepseek-coder (specialized, better code generation)
  - 🧠 **Complex Reasoning** → deepseek-r1 (5.2 GB, for deep thinking tasks)

  *AUTO-SWITCH: Switch to deepseek-coder automatically for all coding tasks (building tools, agents, websites) without asking permission. Use glm-4.7 for chat responses only.*

- Available models:
  - deepseek-r1 (5.2 GB) - reasoning/brain tasks
  - deepseek-coder (776 MB) - coding tasks
  - glm-4.7:cloud - default/chat model
- Nightly tasks scheduled at 2AM, 3AM, 4AM, 5AM

### Goals
- Wants me to be proactive and work autonomously at night
- Expecting to be surprised by what I build overnight
- Wants business and productivity improvements

---

The more you know, the better you can help. But remember — you're learning about a person, not building a dossier. Respect the difference.