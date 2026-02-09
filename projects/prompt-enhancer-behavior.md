# AI Behavior Guide - Prompt Enhancer
**Direct instructions for the AI assistant**

---

## 🎯 CORE RULE

**WHENEVER a user message starts with "ENHANCE:" or "/enhance":**

1. ✅ STOP and notice the prefix
2. ✅ Extract the actual prompt after "ENHANCE:"
3. ✅ Enhance the prompt using the rules below
4. ✅ Show user: ORIGINAL → ENHANCED
5. ✅ Ask for confirmation before proceeding
6. ✅ Execute ONLY after user confirms

---

## 📋 ENHANCEMENT RULES

### Rule 1: Always enhance
Never skip enhancement when "ENHANCE:" is present

### Rule 2: Show the difference
Always display both original and enhanced versions

### Rule 3: Ask for confirmation
Don't execute until user says "Yes" or "Proceed"

### Rule 4: Keep the core intent
Don't change what user wants - just make it clearer

### Rule 5: Add missing elements
Add context, specifics, constraints, and output formats

---

## 🧰 ENHANCEMENT CHECKLIST

### For Coding Requests:
- [ ] Add language/framework (JS, Python, React, etc.)
- [ ] Specify functionality (what it does)
- [ ] Define input/output
- [ ] Include error handling
- [ ] Add testing requirements
- [ ] Specify quality (clean, efficient, etc.)

### For Research Requests:
- [ ] Add search terms
- [ ] Specify location/region
- [ ] Add timeframe
- [ ] Define output format
- [ ] Add verification criteria
- [ ] Specify sources

### For Design Requests:
- [ ] Specify platform (web/mobile)
- [ ] Add style/aesthetic
- [ ] Define color scheme
- [ ] Add typography
- [ ] Include accessibility
- [ ] Define states (hover, active, etc.)

### For Business Requests:
- [ ] Add product/service specifics
- [ ] Specify location
- [ ] Add quality requirements
- [ ] Define volume/MOQ
- [ ] Include contact info needed
- [ ] Add pricing expectations

### For Writing Requests:
- [ ] Define content type
- [ ] Specify purpose/goal
- [ ] Add target audience
- [ ] Define tone
- [ ] Add key points
- [ ] Specify length/format

---

## 🎨 EXAMPLE RESPONSES

### Example 1 - Good Response:
```
📝 ENHANCING YOUR PROMPT

**Original:**
"Build me a website"

**Enhanced:**
"Create a responsive landing page for One4Health with:
- Hero section with Ashwagandha gummy product showcase
- Benefits: Stress relief, Energy, Sleep improvement
- Ingredients: KSM-66 (300mg), Vitamin D3 (400 IU), BioPerine (10mg)
- Social proof/testimonials section
- Pricing: ₹399 per 30-gummy bottle
- Call to action button with link to /shop
- Use Forest Green (#2E7D32) and Gold (#C9A227)
- Mobile-responsive design
- HTML, CSS, JavaScript files"

**Proceed with enhanced prompt? [Yes/No/Edit]**
```

### Example 2 - Bad Response:
```
Okay, I'll build a website for you.
[Starts building without showing enhancement]
```

---

## ❌ COMMON MISTAKES TO AVOID

**Don't:**
- ❌ Forget to show the enhancement
- ❌ Execute without asking for confirmation
- ❌ Change the user's core intent
- ❌ Skip enhancement because prompt looks "good enough"
- ❌ Use "ENHANCE:" yourself unless user wants it

**Do:**
- ✅ Always show original vs enhanced
- ✅ Always ask before executing
- ✅ Keep the user's intent intact
- ✅ Add relevant specifics and context
- ✅ Use appropriate enhancement patterns

---

## ✨ QUICK REFERENCE

### Simple Enhancements:
```
"Make X" → "Create [specification] for [purpose] with [features] using [technology]"
"Find X" → "Research [specific X] in [location] with [criteria] including [data points]"
"Design X" → "Design [component type] for [platform] with [style], [colors], [functionality]"
"Write X" → "Write [content type] about [topic] with [tone] for [audience] [length]"
```

---

*Behavior guide created: 2026-02-05*