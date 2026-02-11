# Sub-Agent Team - OpenClaw

**Purpose:** Delegate specialized tasks to autonomous sub-agents, keeping main agent free for direct user interaction.

---

## 🤖 Agent Roles

### 1. Developer Bot (agent:main:developer)
**Purpose:** Coding, website development, technical tasks
**Alias:** `/dev` or `/coder`
**Model:** deepseek-coder:latest (specialized for coding)

**Handles:**
- Website code (HTML, CSS, JavaScript, Python, etc.)
- Script development
- API integration
- Bug fixing
- Code optimization

---

### 2. Research Bot (agent:main:research)
**Purpose:** Information gathering, market research, supplier research
**Alias:** `/research`
**Model:** glm-4.7:cloud (conversational, good for research)

**Handles:**
- Supplier research
- Competitor analysis
- Market trends
- Technical documentation research
- Industry analysis

---

### 3. Writer Bot (agent:main:writer)
**Purpose:** Content creation, SEO content, documentation
**Alias:** `/writer`
**Model:** glm-4.7:cloud (good for writing)

**Handles:**
- Blog posts
- Product descriptions
- SEO content
- Documentation
- Marketing copy

---

### 4. Design Bot (agent:main:design)
**Purpose:** UI/UX, visuals, graphics
**Alias:** `/design`
**Model:** glm-4.7:cloud (conversational, good for design)

**Handles:**
- Website design
- UI/UX improvements
- Color schemes
- Layout design
- Visual assets

---

### 5. Analyst Bot (agent:main:analyst)
**Purpose:** Data analysis, metrics, insights
**Alias:** `/analyst`
**Model:** kimi-k2.5:cloud (reasoning, deep analysis)

**Handles:**
- Website analytics
- Business metrics
- Performance tracking
- Data visualization
- Trend analysis

---

### 6. Testing Bot (agent:main:testing)
**Purpose:** Quality assurance, bug testing
**Alias:** `/test`
**Model:** phi3:mini (fast, lightweight for testing)

**Handles:**
- Feature testing
- Bug reproduction
- User testing simulation
- Quality checks
- Validation

---

## 📋 Agent Selection Guide

| Task | Use Agent |
|------|-----------|
| Coding, scripts, APIs | Developer Bot |
| Research, suppliers, trends | Research Bot |
| Content, blogs, SEO | Writer Bot |
| Design, UI, layout | Design Bot |
| Data, analytics, metrics | Analyst Bot |
| Testing, QA, validation | Testing Bot |

---

## 🚀 Spawn Command Format

```
/delegate to [agent] with: [task description]
```

**Examples:**
```
/delegate to developer with: Create a contact form for One4Health website with validation

/delegate to research with: Find 5 gummy suppliers in India with contact details

/delegate to writer with: Write SEO blog post about Ashwagandha benefits (800 words)

/delegate to analyst with: Analyze website traffic and suggest improvements

/delegate to design with: Create a hero section design for wellness gummies homepage

/delegate to testing with: Test the checkout flow on One4Health website
```

---

## 📊 Work Flow

1. **Main Agent** receives task from user
2. **Main Agent** identifies appropriate sub-agent
3. **Main Agent** spawns sub-agent with task
4. **Sub-Agent** works autonomously in isolated session
5. **Sub-Agent** reports back to main session when complete
6. **Main Agent** delivers final result to user

---

## ⚙️ Configuration

**All agents use:**
- Model: Specified per agent role
- Thinking: enabled for reasoning tasks
- Timeout: 15 minutes for most tasks
- Cleanup: Keep for review, then delete

---

*Created: 2026-02-11*
*Last Updated: 2026-02-11*