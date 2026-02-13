# Brave API Key Configuration Issue - 2026-02-13

**Issue:** Unable to configure web search due to invalid Brave Search API keys

---

## Problem

Two API keys provided by user were both rejected by Brave Search API:
- `iWWpMCLnDUPCXkzGdIgPLcjSZ9LAoRZhr2tfG80X1B1MYL4q8r59xVBsRCueHOkJ`
- `BSA1sqF2NAnC8WTY1tLgBaJ6nkkWE_n`

**Error returned:** `SUBSCRIPTION_TOKEN_INVALID` (HTTP 422)

---

## Attempted Fixes

| Attempt | Action | Result |
|---------|--------|--------|
| 1 | Configured via `gateway config.patch` | Key 1 - Invalid |
| 2 | Updated env var `BRAVE_API_KEY` | Key 1 - Invalid |
| 3 | Configured via `gateway config.patch` | Key 2 - Invalid |
| 4 | Verified gateway restart | Both keys still invalid |

---

## What Works

- ✅ `web_fetch` - Works for direct URL fetching
- ✅ Gateway configuration - Successfully applied to config
- ✅ Environment variables - Properly set in `openclaw.json`

---

## What Doesn't Work

- ❌ `web_search` - Requires valid Brave API key
- ❌ All user-provided keys - Both rejected by API

---

## Workarounds

1. **Use `web_fetch` for known URLs**
   - Fetch directly from manufacturer websites
   - Access documentation without search
   - Fetch from specific B2B directories

2. **Manual research**
   - Ask user to provide URLs directly
   - Use browser tool when available
   - Document findings from user inputs

3. **Alternative search engines** (if configured)
   - None currently available
   - Consider configuring Tavily or Bing Search API

---

## Instructions for User

To enable web search:
1. Go to https://brave.com/search/api/
2. Sign up or log in
3. Copy the API key (starts like `BSA...`)
4. Ensure the subscription is **Active**
5. Resend the key to me

---

## Files Modified

- `C:\Users\Karan\.openclaw\openclaw.json` - API keys added (both invalid)
- Config applied via `gateway config.patch`

---

## Impact

- Spectrum Life Sciences research: Unable to find contact via web search
- Other supplier research: Will rely on `web_fetch` or manual input
- Skills discovery: Unable to search clawhub effectively

---

**Status:** BLOCKED - Needs valid API key from user
**Created:** 2026-02-13 @ 05:30 PM IST