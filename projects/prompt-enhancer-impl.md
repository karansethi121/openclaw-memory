# Prompt Enhancer Implementation Guide
**How to integrate into OpenClaw**

---

## 🔧 IMPLEMENTATION OPTIONS

### Option 1: Simple Prefix Detection (RECOMMENDED)
Add this to your main agent's prompt or behavior:

```
WHEN user message starts with "ENHANCE: ":
1. Extract the prompt after "ENHANCE: "
2. Apply enhancement patterns from prompt-enhancer-patterns.md
3. Show user: "📝 Your prompt has been enhanced from: [original]"
4. Show user: "To: [enhanced]"
5. Ask: "Proceed with enhanced prompt or edit?"
6. Execute based on response
```

---

### Option 2: OpenClaw Skill Integration
Create a skill file at:
```
C:\Users\Karan\.openclaw\skills\prompt-enhancer\SKILL.md
```

With this content:
```
# Prompt Enhancer Skill

This skill enhances user prompts for better clarity and specificity.

## Detection
Trigger when user message contains "ENHANCE:" prefix or "/enhance" command.

## Enhancement Process
1. Read prompt-enhancer-patterns.md for patterns
2. Detect prompt type (coding, research, design, business, communication)
3. Apply appropriate enhancement template
4. Return enhanced prompt to user for confirmation
5. Execute user-approved prompt

## Files Required
- prompt-enhancer-skill.md (documentation)
- prompt-enhancer-patterns.md (patterns library)
- prompt-enhancer-demo.html (visualization)
```

---

### Option 3: JavaScript Enhancement Engine
Create `prompt-enhancer.js`:
```javascript
const fs = require('fs');

class PromptEnhancer {
  constructor() {
    this.patterns = this.loadPatterns();
  }

  loadPatterns() {
    // Load patterns from prompt-enhancer-patterns.md
    // Parse and structure for lookup
  }

  detectPromptType(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('create') || lower.includes('build') || lower.includes('code')) {
      return 'coding';
    } else if (lower.includes('find') || lower.includes('search') || lower.includes('research')) {
      return 'research';
    } else if (lower.includes('design') || lower.includes('make') || lower.includes('create')) {
      return 'design';
    } else if (lower.includes('supplier') || lower.includes('business')) {
      return 'business';
    } else {
      return 'general';
    }
  }

  enhance(prompt) {
    const type = this.detectPromptType(prompt);
    const pattern = this.patterns[type];
    // Apply pattern enhancement
    return this.applyPattern(prompt, pattern);
  }
}

module.exports = PromptEnhancer;
```

---

## 🚀 QUICK START (Simplest方法)

Add this to your system prompt or agent config:

```markdown
## Prompt Enhancement

When user starts a message with "ENHANCE:" or "/enhance":

1. Parse: Extract the actual prompt after the prefix
2. Analyze: Determine type (coding, research, design, business, general)
3. Enhance: Add missing context, clarify requirements, add constraints
4. Show: Display original vs enhanced for approval
5. Execute: Run the approved enhanced prompt

Example usage:
User: "ENHANCE: Build a button"
AI: Enhancing prompt...
     Original: "Build a button"
     Enhanced: "Create a call-to-action button for One4Health with:
              - Text: 'Buy Now - ₹399'
              - Color: Forest Green gradient (#2E7D32 → #4CAF50)
              - Size: 48px height, 160px width
              - Font: Poppins, bold, white
              - Round: 8px border-radius
              - Hover effects: Lift + shadow
              - Link to /shop
              - Accessibility: aria-label"
     Proceed? [Yes/No]
```

---

## ✅ TESTING

Test with these prompts:
1. "ENHANCE: Make me a website"
2. "ENHANCE: Find suppliers for gummies"
3. "ENHANCE: Write a contact form"
4. "ENHANCE: Design a pricing table"

---

## 📁 FILE LOCATIONS

```
C:\Users\Karan\.openclaw\workspace\
├── prompt-enhancer-skill.md      ✅ Complete
├── prompt-enhancer-patterns.md   ✅ Complete
├── prompt-enhancer-demo.html     ✅ Complete
└── prompt-enhancer-impl.md       ✅ This file
```

---

*Implementation guide created: 2026-02-05*