# Prompt Enhancement Patterns Library
**Comprehensive rules for improving user prompts**

---

## 🎯 PATTERN CATEGORIES

### 1. CODING PATTERNS
### 2. RESEARCH PATTERNS
### 3. DESIGN PATTERNS
### 4. BUSINESS PATTERNS
### 5. COMMUNICATION PATTERNS

---

## 1. 💻 CODING PATTERNS

### CODE-CREATE - Creating New Code
```
WHEN: User wants to create/write/build/code something
ADD THESE ELEMENTS:
✅ Technology stack (language, framework, library)
✅ Functionality requirements (what it should do)
✅ Input/Output specifications
✅ Design patterns to follow
✅ Error handling requirements
✅ Testing considerations
✅ Documentation requirements
✅ Performance requirements (if applicable)
✅ Security considerations (if applicable)

PROMPT TEMPLATE:
"Create a [language] [component type] that:
- Uses [technology/framework/library]
- Implements [functional requirements]
- Accepts [input specifications]
- Returns [output specifications]
- Follows [design pattern/architecture]
- Handles errors with [error handling approach]
- Includes [testing approach]
- Meets these constraints: [specific limitations]
- Code should be [quality attributes: clean, efficient, scalable, etc.]"
```

### CODE-FIX - Fixing Existing Code
```
WHEN: User wants to fix/repair/debug code
ADD THESE ELEMENTS:
✅ Problem description (what's broken)
✅ Expected behavior (what should happen)
✅ Current behavior (what's happening instead)
✅ Error messages (if any)
✅ Code snippet (if available)
✅ Context (where/how it's used)
✅ Constraints (can't change X, must keep Y)

PROMPT TEMPLATE:
"Fix this code that [problem description]:
[CODE SNIPPET]

Expected behavior: [what should happen]
Current behavior: [what's happening instead]
Errors: [error messages if any]

Please provide:
1. Explanation of what's wrong
2. Fixed code with comments
3. Explanation of the fix
4. How to prevent similar issues"
```

### CODE-OPTIMIZE - Optimizing Code
```
WHEN: User wants to improve/optimize code
ADD THESE ELEMENTS:
✅ Performance goal (speed, memory, efficiency)
✅ Bottlenecks identified (if known)
✅ Constraints (can't change architecture, etc.)
✅ Priority (speed vs readability vs maintainability)

PROMPT TEMPLATE:
"Optimize this [language] code for [optimization goal]:
[CODE SNIPPET]

Current performance: [metrics if available]
Target performance: [goal]
Constraints: [changes not allowed]
Priority: [attribute ranking]

Please provide:
1. Identified bottlenecks
2. Optimized code
3. Performance improvements
4. Trade-offs made"
```

---

## 2. 🔍 RESEARCH PATTERNS

### RESEARCH-FIND - Finding Information
```
WHEN: User wants to find/search/lookup information
ADD THESE ELEMENTS:
✅ Search terms (specific keywords)
✅ Sources to check (websites, databases, types)
✅ Geographic scope (if relevant)
✅ Time period (recent, historical, specific range)
✅ Output format (list, summary, detailed)
✅ Verification requirements (cite sources)
✅ Prioritization criteria (most important first)

PROMPT TEMPLATE:
"Research and find information about [specific topic]:
- Search terms: [primary keywords, secondary keywords]
- Focus on: [specific aspects to prioritize]
- Timeframe: [date range - e.g., last 30 days, 2024-2025]
- Sources: [preferred source types]
- Output: [format - list, table, summary]
- Must include: [specific data points needed]
- Verify: [reliability requirements]
- Exclude: [what to ignore/avoid]

Please provide:
1. Main findings
2. Supporting details
3. Sources/references
4. Confidence level"
```

### RESEARCH-COMPARE - Comparing Options
```
WHEN: User wants to compare A vs B
ADD THESE ELEMENTS:
✅ Items being compared (exact names)
✅ Comparison criteria (what matters)
✅ Decision factors (pros/cons)
✅ Context (how/where it will be used)
✅ Priorities (most important factors first)

PROMPT TEMPLATE:
"Compare these options:
[OPTION A]
[OPTION B]

Comparison criteria:
1. [Factor 1] - [priority: high/medium/low]
2. [Factor 2] - [priority: high/medium/low]
3. [Factor 3] - [priority: high/medium/low]

Context: [how/where it will be used]
Priorities: [most important factors]

Please provide:
1. Detailed comparison table
2. Pros and cons of each
3. Recommendation with justification
4. When to choose each option"
```

---

## 3. 🎨 DESIGN PATTERNS

### DESIGN-COMPONENT - UI Component Design
```
WHEN: User wants to design a UI component
ADD THESE ELEMENTS:
✅ Component type (button, card, form, etc.)
✅ Purpose/function (what it should do)
✅ Visual style (modern, classic, etc.)
✅ Color scheme (specific colors or palette)
✅ Platform (web, mobile, both)
✅ Accessibility requirements
✅ Responsive behavior
✅ Interactive states (hover, active, disabled)
✅ Content (text, icons, images)

PROMPT TEMPLATE:
"Design a [component type] for [purpose]:
- Platform: [web/mobile/desktop]
- Style: [aesthetic - modern, minimalist, etc.]
- Colors: [primary, secondary, accent, background, text]
- Typography: [font family, sizes, weights]
- Accessibility: [WCAG level, specific requirements]
- Interactive states: [hover, active, disabled, focus styles]
- Responsive: [breakpoint requirements]
- Content: [text labels, icons, images]

Output:
1. Visual description
2. CSS/styling code
3. HTML structure
4. JavaScript functionality (if needed)"
```

### DESIGN-LAYOUT - Page/Screen Layout
```
WHEN: User wants to design a page layout
ADD THESE ELEMENTS:
✅ Page purpose/goal (what user should do)
✅ Target device (desktop, mobile, responsive)
✅ Sections/modules needed
✅ Information hierarchy (most to least important)
✅ User flow (sequence of actions)
✅ Navigation requirements

PROMPT TEMPLATE:
"Design a [page type] layout:
- Purpose: [user goal / main action]
- Device: [desktop-first / mobile-first / responsive]
- Sections: [list of sections needed]
- Information hierarchy:
  1. [Most important element]
  2. [Second most important]
  3. [etc.]
- User flow: [step 1 → step 2 → step 3...]
- Navigation: [menu, breadcrumbs, back button, etc.]

Output:
1. Section-by-section breakdown
2. Visual layout structure
3. Responsive behavior
4. HTML/CSS implementation"
```

---

## 4. 💼 BUSINESS PATTERNS

### BUSINESS-SUPPLIER - Finding Suppliers/Partners
```
WHEN: User wants to find suppliers, manufacturers, partners
ADD THESE ELEMENTS:
✅ Product/Service type (specific)
✅ Location/Region preference
✅ Quality requirements (certifications, standards)
✅ Volume/Capacity needs (MOQ, annual volume)
✅ Pricing expectations (range)
✅ Contact information needed
✅ Verification requirements (reviews, legitimacy)

PROMPT TEMPLATE:
"Find [product/service] suppliers/Partners for [company/project]:
- Product/Service: [specific requirements]
- Location preference: [region/country]
- Quality requirements: [certifications, standards, etc.]
- Volume: [MOQ, annual quantity]
- Capacity: [production capacity needed]
- Pricing range: [target price per unit]
- Contact info needed: [phone, email, address]
- Must have: [non-negotiable requirements]
- Nice to have: [optional preferences]

Output format:
- Company name
- Location
- Phone
- Email
- Website
- Products/Services
- Certifications
- Capacity/MOQ
- Pricing (if available)
- Notes/Legitimacy check"
```

### BUSINESS-RESEARCH - Market/Business Research
```
WHEN: User wants business/market information
ADD THESE ELEMENTS:
✅ Market segment (industry, niche)
✅ Geography (local, national, global)
✅ Time period (current, historical, future)
✅ Specific metrics needed (market size, growth rate)
✅ Competitors to analyze
✅ Customer segments

PROMPT TEMPLATE:
"Research the [industry/market] market:
- Focus: [specific segment]
- Geography: [region - India, Global, etc.]
- Timeframe: [current state, forecast, trends]
- Key metrics: [specific data needed - market size, growth, etc.]
- Target customers: [demographics, segments]
- Competitors: [specific companies to analyze]

Provide:
1. Market overview
2. Key statistics
3. Trends and projections
4. Competitive landscape
5. Opportunities and threats
6. Sources/references"
```

---

## 5. 💬 COMMUNICATION PATTERNS

### COMM-WRITE - Writing Content
```
WHEN: User wants to write something (email, blog, report)
ADD THESE ELEMENTS:
✅ Content type (email, blog post, report, etc.)
✅ Purpose/goal (what reader should do/feel)
✅ Target audience (who is reading)
✅ Tone (formal, casual, friendly, professional)
✅ Key points to include
✅ Call to action (what to do next)
✅ Length (word count approx)
✅ Format (structure, sections)

PROMPT TEMPLATE:
"Write a [content type] that [goal/purpose]:
- Target audience: [who will read this]
- Tone: [style - formal, casual, professional, etc.]
- Key points to include:
  1. [Point 1]
  2. [Point 2]
  3. [Point 3]
- Call to action: [what reader should do]
- Length: [approximate word count]
- Format: [structure - intro/body/conclusion, etc.]

Make it [quality attributes - engaging, clear, concise, etc.]"
```

### COMM-REPLY - Replying to Communication
```
WHEN: User wants to reply to someone
ADD THESE ELEMENTS:
✅ Original message context (what they said)
✅ Relationship (colleague, client, friend)
✅ Goal (what to achieve with reply)
✅ Tone (appropriate for relationship)
✅ Response requirements (what to address)

PROMPT TEMPLATE:
"Reply to this [message/email/comment]:

[ORIGINAL MESSAGE]

Your role: [your relationship to sender]
Goal of reply: [what you want to achieve]
Must address: [specific points to respond to]
Tone: [appropriate style]

Provide a reply that is [quality attributes]."
```

---

## 🧠 INTELLIGENT ENHANCEMENT RULES

### Rule 1: Detect Missing Context
```
IF prompt lacks: WHO, WHAT, WHEN, WHERE, WHY, HOW
THEN prompt the user OR make reasonable assumptions
```

### Rule 2: Detect Ambiguity
```
IF prompt has: vague terms like "something", "stuff", "things"
THEN ask for clarification OR provide options
```

### Rule 3: Detect Incomplete Specs
```
IF prompt is a coding task AND lacks:
- language/framework
- input/output
- error handling
THEN add these elements
```

### Rule 4: Detect Research Scope Issues
```
IF prompt is research AND lacks:
- geographic scope
- timeframe
- source types
THEN ask user OR make reasonable assumptions
```

### Rule 5: Detect Design Vagueness
```
IF prompt is design AND lacks:
- platform
- style
- target audience
THEN add these elements or ask
```

---

## ⚡ QUICK ENHANCEMENT TEMPLATES

### One-Liner Enhancers:
```
"Make it good" → "Make it [quality], [specific attribute], [specific context]"

"Fix this" → "Fix this [specific issue] by [approach], ensuring [constraint]"

"Research X" → "Research X focusing on [aspect], using [sources], covering [timeframe]"

"Create Y" → "Create Y using [technology], that [does what], with [features]"

"Find Z" → "Find Z in [location], with [criteria], including [contact/info]"
```

---

## 🎯 ENHANCEMENT DIFFERENCE EXAMPLES

### Before & After - Real Examples:

#### Vague Request → Clear Specification
```
BEFORE: "Make a button for the website"
AFTER: "Create a call-to-action button for One4Health homepage hero section:
  - Text: 'Buy Now - ₹399'
  - Colors: Forest Green gradient (#2E7D32 → #4CAF50)
  - Size: 48px height, 160px width
  - Font: Poppins, bold, white
  - Border-radius: 8px
  - Hover: Lift 2px with box-shadow
  - Link: /shop
  - Accessibility: aria-label='Shop One4Health Ashwagandha Gummies at ₹399'"
```

#### Research → Comprehensive Search
```
BEFORE: "Find gummy suppliers in India"
AFTER: "Research nutraceutical gummy manufacturers in India with:
  - Location: Himachal Pradesh (Baddi), Gujarat (Ahmedabad), or Punjab
  - Products: Ashwagandha gummies OR capability to manufacture
  - Services: Contract manufacturing or third-party manufacturing
  - Quality: WHO-GMP, ISO, or equivalent certification
  - Contact: Must include phone number and email address
  - Pricing: ₹40-80 per 30gummy bottle preferred
  - MOQ: Up to 50,000 bottles acceptable
  - Output: List with company name, location, phone, email, website, products, certifications, specialties"
```

#### Coding → Complete Implementation
```
BEFORE: "Write a form validation script"
AFTER: "Write a JavaScript form validator for One4Health contact form:
  - Fields: Name, Email, Phone, Message
  - Validation rules:
    • Name: Required, 2-50 chars, letters only
    • Email: Required, valid email format
    • Phone: Required, 10 digits, Indian format
    • Message: Required, 10-500 chars
  - Real-time feedback with styled error messages
  - HTML5 validation attributes + JavaScript
  - Accessibility: aria-live regions, ARIA labels
  - Mobile-friendly error display
  - Prevent form submission if invalid
  - Success message on valid submit
  - Clean, commented, reusable code"
```

---

*Pattern Library created: 2026-02-05*
*Use with prompt-enhancer-skill.md for complete system*