# Prompt Enhancer Skill
**Version:** 1.0
**Created:** 2026-02-05

---

## 🎯 PURPOSE

Automatically enhance user prompts for clarity, specificity, and effectiveness before processing.

---

## 🚀 USAGE

### Prefix Method (Recommended)
```
User: ENHANCE: Build me a website
AI: I will enhance this prompt first...

Enhanced: "Build a modern, responsive landing page for One4Health with the following features:
1. Hero section with Ashwagandha gummy product showcase
2. Product benefits section (stress relief, energy, sleep)
3. Ingredient highlights (KSM-66, Vitamin D3, BioPerine)
4. Social proof/testimonials section
5. Call-to-action with ₹399 pricing
6. Use modern design with Forest Green (#2E7D32) and Gold (#C9A227)
7. Mobile-responsive design
8. Include contact form and footer

Please create HTML, CSS, and JavaScript files."

Now I'll build this for you...
```

---

## 📋 ENHANCEMENT STRATEGIES

### 1. CLARIFY VAGUE REQUESTS
**Original:** "Build me a website"
**Enhanced:** "Build a [specific type] website for [business name] with [key features] for [purpose] targeting [audience]"

### 2. ADD MISSING CONTEXT
**Original:** "Find suppliers"
**Enhanced:** "Find gummy vitamin suppliers in [region] for [product type] with these requirements: [specific criteria] including contact information"

### 3. SUGGEST SPECIFIC OUTPUTS
**Original:** "Write something"
**Enhanced:** "Write a [format] about [topic] with [tone] of approximately [length] words, including [key points]"

### 4. IMPROVE FORMATTING
**Original:** "make it look good"
**Enhanced:** "Use modern design with [specific aesthetic], [color scheme], [typography], ensuring [usability features]"

### 5. ADD CONSTRAINTS
**Original:** "Fix this code"
**Enhanced:** "Fix this code to [objective], ensuring it's [quality standards], handles [edge cases], and includes [error handling]"

---

## 🧠 ENHANCEMENT PATTERNS

### Pattern 1: Coding Tasks
```
IF prompt contains: "build", "create", "write code", "develop"
THEN enhance to include:
- Technology stack specifications
- Functional requirements
- Non-functional requirements
- Testing considerations
- Documentation needs
```

### Pattern 2: Research Tasks
```
IF prompt contains: "find", "search", "research", "look up"
THEN enhance to include:
- Specific search terms
- Geographic scope
- Timeframe/context
- Required output format
- Verification criteria
```

### Pattern 3: Design Tasks
```
IF prompt contains: "design", "create UI", "make it look"
THEN enhance to include:
- Target platform (web/mobile)
- Design style/theme
- Color specifications
- Typography preferences
- User experience goals
```

### Pattern 4: Business Tasks
```
IF prompt contains: "suppliers", "contacts", "business"
THEN enhance to include:
- Industry/product specifics
- Location/region preferences
- Quality/certification requirements
- Volume/MOQ considerations
- Contact information needed
```

---

## 🎨 EXAMPLES

### Example 1: Vague → Clear
**User:** "Make a button"
**Enhanced:** "Create a call-to-action button for One4Health website with:
- Forest Green gradient background (#2E7D32 to #4CAF50)
- White text, bold font
- Rounded corners (8px border-radius)
- Hover effect with slight lift animation
- Size: 48px height, 160px width
- Link to /shop page
- Text: 'Buy Now - ₹399'"

### Example 2: Research → Specific
**User:** "Find gummy suppliers"
**Enhanced:** "Research and find nutraceutical gummy manufacturers in India with these criteria:
- Location: Preferably Himachal Pradesh, Gujarat, or Punjab
- Products: Must manufacture Ashwagandha gummies or have capability
- Capacity: Contract manufacturing or third-party manufacturing
- Quality: WHO-GMP or ISO certified
- Contact: Must provide phone number and email
- Pricing: ₹40-80 range per 30gummy bottle preferred
- Output: List with company name, phone, email, location, specialties"

### Example 3: Coding → Complete
**User:** "Write JavaScript for form validation"
**Enhanced:** "Write a JavaScript form validation script for One4Health contact form with:
- HTML5 validation attributes
- Real-time field feedback (email format, phone format)
- Password strength checker
- Required field highlighting
- Error message display in styled div
- Success message on valid submission
- Prevent default form submission
- Include accessibility attributes (aria-live, aria-describedby)
- Mobile-friendly error display
- Code should be clean, commented, and reusable"

---

## 🔧 TECHNICAL IMPLEMENTATION

### For OpenClaw Integration:
```javascript
// Pseudo-code for prompt enhancement process
function enhancePrompt(userPrompt) {
  // Detect prompt type
  const promptType = detectPromptType(userPrompt);

  // Apply enhancement patterns
  const enhancements = getEnhancements(promptType);
  const enhancedPrompt = applyEnhancements(userPrompt, enhancements);

  // Show user what was enhanced
  console.log(`Your prompt enhanced from: "${userPrompt}"`);
  console.log(`To: "${enhancedPrompt}"`);

  return enhancedPrompt;
}
```

---

## ⚙️ CONFIGURATION

### Enhancement Levels:
1. **Light** - Fix obvious issues only
2. **Medium** - Add missing context and structure
3. **Heavy** - Comprehensive enhancement with all details

### User Preferences:
- `enhancer.level` = light/medium/heavy (default: medium)
- `enhancer.auto` = true/false (auto-enhance all prompts)
- `enhancer.show_diff` = true/false (show what changed)

---

## 📊 QUALITY METRICS

### Measuring Enhancement Success:
- Clarity score (0-10)
- Specificity score (0-10)
- Completeness score (0-10)
- Actionability score (0-10)

### Target Scores:
- Before enhancement: Average 4-5/10
- After enhancement: Average 8-9/10

---

## 🎯 BEST PRACTICES

### For Users:
- Use `ENHANCE:` prefix for automatic enhancement
- Provide as much initial context as possible
- Review enhanced prompt before execution
- Adjust enhancement level based on needs

### For AI:
- Always preserve user's original intent
- Never change the core request
- Explain what was enhanced and why
- Allow users to edit enhanced prompt
- Apply enhancements intelligently, not mechanically

---

## 🔄 WORKFLOW

```
User Request
    ↓
Detect "ENHANCE:" prefix? → Yes → Enhance Prompt → Show Difference
    ↓ No
   Process Directly
    ↓
Execute Task
    ↓
Return Results
```

---

## 📚 PATTERN LIBRARY

### Coding Prompts:
```
Original: "Write a function to X"
Enhanced: "Write a [language] function to [specific action] that:
- Takes [parameters]
- Returns [output type]
- Handles [edge cases]
- Includes [error handling]
- Is [performance requirement]
- Follows [style guide]
- Is [testable]"
```

### Research Prompts:
```
Original: "Find information about X"
Enhanced: "Research and compile comprehensive information about [topic]:
- Search terms: [specific keywords]
- Sources: [preferred sources/reliability]
- Date range: [timeframe]
- Format: [structured output]
- Focus: [specific aspects]
- Verify: [fact-checking requirements]"
```

### Design Prompts:
```
Original: "Design a component"
Enhanced: "Design a [component type] with:
- Purpose: [user goal]
- Style: [aesthetic preference]
- Platform: [web/mobile/desktop]
- Accessibility: [WCAG level]
- States: [hover, active, disabled, etc.]
- Responsiveness: [breakpoint requirements]"
```

---

## ✅ SUCCESS INDICATORS

### Successful Enhancement:
- User understands what will be done
- AI has specific instructions to follow
- No ambiguity in requirements
- Clear output format specified
- All necessary parameters provided

### When NOT to Enhance:
- Prompt is already specific and clear
- User explicitly doesn't want enhancement
- Quick/ casual conversation
- Simple yes/no questions
- System commands/technical operations

---

*Document created: 2026-02-05*
*Next: Implement skill in OpenClaw skill system*