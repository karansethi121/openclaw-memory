# Prompt Enhancer System - Integration Instructions
**How it works in OpenClaw**

---

## 🚀 HOW TO USE (Simple Prefix Method)

### USER:
Send a message starting with `ENHANCE:` followed by your prompt

### EXAMPLES:
```
User: ENHANCE: Build a website
User: ENHANCE: Find gummy suppliers in India
User: ENHANCE: Create a button for One4Health
User: ENHANCE: Write an email to a supplier
```

### AI (YOU):
1. Detect `ENHANCE:` prefix at start of message
2. Extract actual prompt after the prefix
3. Analyze prompt type (coding, research, design, business, communication)
4. Apply appropriate enhancement pattern from `prompt-enhancer-patterns.md`
5. Show user the enhanced version
6. Ask for confirmation to proceed
7. Execute the enhanced prompt

---

## 📋 PROMPT TYPE DETECTION RULES

### Coding Task (💻)
Trigger words: create, build, write code, develop, function, implementation
Enhance with: Technology stack, functional requirements, input/output, error handling, testing

### Research Task (🔍)
Trigger words: find, search, research, look up, investigate, discover
Enhance with: Search terms, sources, time period, output format, verification criteria

### Design Task (🎨)
Trigger words: design, create UI, make it look, style, layout, component
Enhance with: Platform, aesthetic, colors, typography, accessibility, states

### Business Task (💼)
Trigger words: supplier, manufacturer, business, partner, contact
Enhance with: Location, quality requirements, volume, pricing, contact info

### Writing Task (💬)
Trigger words: write, email, blog, content, message
Enhance with: Content type, purpose, audience, tone, key points, length

---

## ✨ ENHANCEMENT EXAMPLE

### USER SAYS:
```
ENHANCE: Find gummy suppliers
```

### AI SHOULD RESPOND:
```
📝 ENHANCING YOUR PROMPT

**Original:**
"Find gummy suppliers"

**Enhanced:**
"Research and find nutraceutical gummy manufacturers in India with:
- Location: Himachal Pradesh (Baddi), Gujarat (Ahmedabad), or Punjab
- Products: Ashwagandha gummies OR capability to manufacture
- Services: Contract manufacturing or third-party manufacturing
- Quality: WHO-GMP, ISO, or equivalent certification
- Contact: Must include phone number and email address
- Pricing: ₹40-80 per 30gummy bottle preferred
- MOQ: Up to 50,000 bottles acceptable

Output format:
- Company name
- Location
- Phone
- Email
- Website
- Products
- Certifications
- Specialties"

**Proceed with this enhanced prompt? [Yes/No/Edit]**
```

---

## 🎯 INTEGRATION INSTRUCTIONS

### For AI (When Processing Messages):

```javascript
// Pseudo-code for prompt enhancer integration
function processUserMessage(message) {
  // Step 1: Check for ENHANCE: prefix
  const hasEnhancePrefix = message.trim().toLowerCase().startsWith('enhance:');

  if (hasEnhancePrefix) {
    // Step 2: Extract actual prompt
    const originalPrompt = message.replace(/^enhance:\s*/i, '').trim();

    // Step 3: Detect prompt type
    const promptType = detectPromptType(originalPrompt);

    // Step 4: Get enhancement pattern
    const pattern = loadEnhancementPattern(promptType);

    // Step 5: Apply enhancement
    const enhancedPrompt = applyEnhancement(originalPrompt, pattern);

    // Step 6: Show user and ask confirmation
    return showEnhancement(originalPrompt, enhancedPrompt);
  } else {
    // Process normally without enhancement
    return processNormalMessage(message);
  }
}
```

---

## 📁 RELATED FILES

- `prompt-enhancer-skill.md` - Documentation
- `prompt-enhancer-patterns.md` - Enhancement patterns library
- `prompt-enhancer-demo.html` - Interactive demo
- `prompt-enhancer-impl.md` - Implementation guide
- `prompt-enhancer-integration.md` - This file

---

## ✅ TESTING

Test with these prompts:
1. `ENHANCE: Make me a button`
2. `ENHANCE: Find suppliers for gummies`
3. `ENHANCE: Write a contact form`
4. `ENHANCE: Design a pricing table`
5. `ENHANCE: Create an agent`

---

## 🔄 WORKFLOW

```
User Message
    ↓
Starts with "ENHANCE:"?
    ↓ Yes
Extract prompt
    ↓
Detect type (coding/research/design/business/writing)
    ↓
Apply enhancement pattern
    ↓
Show: Original → Enhanced
    ↓
User confirms?
    ↓ Yes
Execute enhanced request
    ↓
Return results
```

---

*Integration instructions created: 2026-02-05*