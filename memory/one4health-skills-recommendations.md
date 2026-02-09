# One4Health Skills Recommendations - 2026-02-09

---

## ✅ Already Installed Skills (Top Priority)

### 1. GitHub Skill 🐙 - HIGH PRIORITY
**Location:** `C:\Users\Karan\AppData\Roaming\npm\node_modules\openclaw\skills\github\`

**Use For:**
- Netlify auto-deploy (already configured!)
- Track issues and pull requests
- Monitor CI/CD runs
- Version control for design assets

**Commands:**
```bash
gh issue list
gh pr list
gh run list
gh repo view
```

**Quick Win:** Every git push → instant live site on Netlify

---

### 2. Canvas Skill 🎨 - HIGH PRIORITY
**Location:** `C:\Users\Karan\AppData\Roaming\npm\node_modules\openclaw\skills\canvas\`

**Use For:**
- Display website designs live
- Show analytics dashboards
- Preview landing page mockups
- Interactive prototype testing with stakeholders

**Commands:**
```
canvas action:present node:<id> target:<url>
canvas action:navigate node:<id> url:<new-url>
canvas action:snapshot node:<id>
```

**Quick Win:** Show design mockups to stakeholders in real-time

---

### 3. OpenAI Image Gen 🖼️ - HIGH PRIORITY
**Location:** `C:\Users\Karan\AppData\Roaming\npm\node_modules\openclaw\skills\openai-image-gen\`

**Use For:**
- Generate unique gummy product images
- Create lifestyle photos without photographers
- Design social media assets
- Create banner and hero images

**Requirements:**
- Environment variable: `OPENAI_API_KEY`

**Quick Win:** Generate 10 unique gummy product images in minutes

---

### 4. Analytics Skill 📊 - HIGH PRIORITY
**Location:** `C:\Users\Karan\.openclaw\workspace\skills\analytics\`

**Use For:**
- Track website performance metrics
- Monitor user engagement
- Analyze traffic patterns
- Track conversion rates
- Generate reports with Chart.js

**Commands:**
```
"Show analytics" - Display dashboard on Canvas
"Quality score [0-100]" - Log quality metric
"Task completed" - Track completion rate
"Generate analytics report" - Full report
```

**Quick Win:** Understand how customers interact with your website

---

### 5. Summarize Skill 📝 - MEDIUM PRIORITY
**Location:** `C:\Users\Karan\AppData\Roaming\npm\node_modules\openclaw\skills\summarize\`

**Use For:**
- Competitor website analysis
- Wellness industry research
- Customer feedback synthesis
- Blog post drafting
- YouTube video summarization

**Commands:**
```
"Summarize this URL: <link>"
"Summarize this YouTube: <link>"
"Summarize this file: <path>"
```

**Quick Win:** Analyze 5 competitor sites in 30 minutes instead of 5 hours

---

## 🎯 Skills in Workspace (Ready to Use)

### canvas-os - Enhanced Canvas
**Location:** `workspace/skills/canvas-os`
**Status:** Already available
- OS-like interface on Canvas
- Desktop/menus/files UI

### video-frames - Video Processing
**Location:** `workspace/skills/video-frames`
- Extract frames from videos
- Create video clips
- Product video demos

### cron-scheduling - Task Automation
**Location:** `workspace/skills/cron-scheduling`
- Schedule website updates
- Automate social media posts
- Backup automations

---

## 🌟 Recommended Community Skills (to Install)

### Design & Documentation

#### Notion 📓
**Purpose:** Collaborative design documentation
**Use For:**
- Design system documentation
- Brand guidelines
- Component library
- Shared design decisions

#### Obsidian 🧠
**Purpose:** Knowledge base for design decisions
**Use For:**
- Design research notes
- A/B testing results
- Customer feedback tracking
- Design patterns documentation

#### Bear Notes 🐻 (Mac only)
**Purpose:** Quick design sketches and notes
**Use For:**
- Quick design ideas
- Mobile thoughts capture
- Design inspiration bookmarks

---

### Content & Marketing

#### Blogwatcher 👀
**Purpose:** Track design/health blogs for inspiration
**Use For:**
- Monitor competitor blogs
- Wellness industry trends
- Design inspiration curation

#### Slack 📱
**Purpose:** Team collaboration
**Use For:**
- Design team communication
- Stakeholder updates
- Project management

#### Discord 💬
**Purpose:** Community engagement
**Use For:**
- Customer support
- Community building
- Real-time Q&A

---

## 🚀 Implementation Plan for One4Health

### Week 1 (Immediate)
1. ✅ **GitHub** - Verify Netlify auto-deploy is working
2. ✅ **Canvas** - Use for next design mockup review
3. ✅ **OpenAI Image Gen** - Generate 10 gummy product images
4. ✅ **Summarize** - Analyze 3 competitor wellness brands

### Month 1 (Foundation)
1. **Analytics** - Set up website tracking and analytics dashboard
2. **Notion** - Create design system documentation
3. **Video-frames** - Create 2 product demo videos
4. **Cron-scheduling** - Automate social media posting

### Month 2+ (Growth)
1. **Discord** - Launch community support channel
2. **Slack** - Use for design team collaboration
3. **Custom Skills** - Build specialized One4Health skills

---

## 💡 Specific Use Cases for One4Health

### Product Development
```
Use OpenAI Image Gen > Generate 10 gummy images
Use Canvas > Show mockups to stakeholders
Use GitHub > Auto-deploy to website
```

### Competitor Analysis
```
Use Summarize > 5 competitor sites = 30 min vs 5 hours
Use Notion > Store insights in shared doc
Use Analytics > Track how they're performing
```

### Content Creation
```
Use OpenAI Image Gen > Instagram graphics
Use Summarize > Wellness research articles
Use Blogwatcher > Industry trend monitoring
```

### Design System
```
Use Notion > Component library
Use Obsidian > Design decisions log
Use Canvas > Live design reviews
```

---

## 📝 Skill Installation Commands

**To install community skills:**
```bash
# Notion (if available in openclaw)
npx clawhub install notion

# Or manually from downloaded repo
cp -r workspace/openclaw-skills-repo/skills/<author>/<skill>/* \
      ~/.openclaw/skills/<skill>/
```

---

## 🔍 How to Search for More Skills

**Browse downloaded skills:**
```bash
cd workspace/openclaw-skills-repo/skills
# Explore author folders
# Read SKILL.md files
# Find relevant skills
```

**Use Online:**
- Visit: https://clawhub.ai
- Search for: "design", "marketing", "web", "seo"
- Browse categories

**Use npx clawhub:**
```bash
npx clawhub search design
npx clawhub search web
npx clawhub install <skill-name>
```

---

## 🎓 Training & Getting Started

### For Each Skill:
1. Read the SKILL.md file
2. Try basic commands
3. Test with One4Health context
4. Create One4Health-specific workflows

### Recommended Learning Path:
1. **Week 1:** GitHub + Canvas + OpenAI Image Gen
2. **Week 2:** Analytics + Summarize
3. **Week 3:** Notion + Video-frames
4. **Week 4:** Community skills exploration

---

## 📊 Expected Impact

### Productivity Gains:
- **Website deployment:** 10 min → 30 seconds (auto-deploy)
- **Image creation:** 1 hour → 10 minutes (AI generation)
- **Competitor research:** 5 hours → 30 minutes (summarize)
- **Design reviews:** 2 days → 1 hour (Canvas live preview)

### Quality Improvements:
- Data-driven decisions (Analytics)
- Consistent brand assets (Image Gen)
- Documented design systems (Notion/Obsidian)
- Faster iteration cycles (GitHub + Netlify)

---

**Documented:** 2026-02-09 15:53 IST
**Telegram Message:** Sent (Message ID 1437)
**Next Review:** After testing recommended skills