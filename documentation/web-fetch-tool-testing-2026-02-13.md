# Web Fetch Tool Testing - 2026-02-13

**Task:** Test `web_fetch` tool as web_search alternative (API key blocked)

---

## Test Results ✅

### Test 1: One4Health Website
- **URL:** https://one4health.netlify.app
- **Status:** HTTP 200
- **Extraction:** Successful (readability mode)
- **Content Type:** text/html
- **Time:** 620ms
- **Truncated:** Yes (at 2000 chars limit)

### Extracted Content
```markdown
MADE IN INDIA 🇮🇳

## Wellness That Tastes Amazing

 Taste the Benefits. Not the Supplements.

 Premium wellness gummies made with clinically studied ingredients.
 Simple, delicious, and effective for your modern lifestyle.

 🍃 Stress Relief
 😴 Better Sleep
 ⚡ Natural Energy
 🛡️ Immune Support

 10,000+ Happy Customers
 4.9★ Average Rating
 Free Shipping

 Products:
 - Complete Wellness Trio - ₹891 (Save ₹606, 40% OFF)
 - Stress & Sleep Bundle - ₹594 (Save ₹404, 40% OFF)
 - Ashwagandha Gummies - ₹299 (30 gummies)
 - Dreamy Sleep Gummies - ₹349 (30 gummies)
 - Natural Energy Gummies - ₹299 (30 gummies)
 - Immune Support Gummies - ₹299 (coming soon)
```

---

## Tool Capabilities

### What Works ✅
- Direct URL fetching (any HTTP/HTTPS URL)
- HTML → Markdown extraction (readability mode)
- HTML → Text extraction (`extractMode: "text"`)
- Title extraction (automatic)
- Content truncation control (`maxChars`)
- Fast response (< 1s)

### What Doesn't Work ❌
- No searching (need specific URL)
- Captcha-protected sites blocked
- Some paywalled content (may return truncated content)

---

## Usage Pattern for Research

When `web_search` is blocked:

1. **Ask user for specific URLs** of suppliers/websites
2. **Use `web_fetch` to extract** company info, product details
3. **Parse extracted content** for contact info, pricing, capabilities
4. **Document findings** in research files

### Example Command
```javascript
web_fetch({
  url: "https://example.com/supplier-page",
  maxChars: 5000,
  extractMode: "markdown"
})
```

### Response Structure
```json
{
  "url": "https://example.com",
  "status": 200,
  "title": "Page Title",
  "text": "Extracted markdown content...",
  "truncated": true/false,
  "length": 1234,
  "tookMs": 500
}
```

---

## Limitations

1. **No search capability** - Must have exact URL
2. **Captcha blocks** - Can't bypass captchas
3. **JavaScript content** - May miss dynamic content (needs browser for full JS)
4. **File size limits** - Truncates at maxChars (adjustable)

---

## Workaround for Web Search Block

Since `web_search` is blocked by invalid BRAVE_API_KEY:

1. **User provides URLs** of potential suppliers
2. **Use `web_fetch`** to extract company info
3. **Manual search** by user → send me the URLs
4. **Browser tool** (when available) for JS-heavy sites

---

## Notes

- web_fetch is faster than full browser automation
- Readability mode produces clean markdown
- Best for static content (company info, pricing, product details)
- Combine with `browser` tool for interactive content

---

**Status:** web_fetch verified working ✅
**Tested By:** Agent capability testing (2026-02-13 07:30 PM)
**Next:** Use for supplier research when URLs are known