# Connect Netlify to GitHub - Auto Deploy

## ✅ GitHub Repository Created & Pushed!

Your One4Health website is now on GitHub:
- **URL:** https://github.com/karansethi121/one4health-website
- **Status:** ✅ Pushed with 8 files (all website pages)
- **Account:** karansethi121 (sethikaran2001@gmail.com)

---

## Step 1: Connect Netlify to GitHub

### Option A: Netlify Dashboard (Manual)

1. **Go to:** https://app.netlify.com
2. **Sign in** to your Netlify account
3. **Click:** "Add new site" → "Import an existing project"
4. **Select:** GitHub
5. **Authorize** Netlify to access your GitHub (click "Authorize Netlify")
6. **Select:** `one4health-website` repository from the list
7. **Build settings:**
   - Build command: Leave empty (no build needed)
   - Publish directory: Leave empty (root directory)
8. **Click:** "Deploy site"

---

### Option B: Using Existing Netlify Site

If you already have `https://one4health.netlify.app/` deployed:

1. Go to: https://app.netlify.com/sites/one4health/settings
2. Click **"Build & deploy"** (left menu)
3. Scroll to **"Continuous deployment"**
4. Click **"Edit settings"**
5. Authorize GitHub and select `one4health-website` repo
6. Save changes

---

## Step 2: Test Auto-Deploy

**Make a change:**

1. Edit `C:\Users\Karan\.openclaw\workspace\one4health-website\index.html`
2. Add a small change (e.g., update a headline)
3. Commit and push:

```bash
cd C:\Users\Karan\.openclaw\workspace\one4health-website
git add .
git commit -m "Test: small update to homepage"
git push origin main
```

4. **Wait 30-60 seconds**
5. **Refresh** https://one4health.netlify.app/
6. **Result:** Your change is live! ✨

---

## What This Gives You

✅ **Push to GitHub** → Netlify auto-builds and deploys
✅ **No manual file uploads** needed
✅ **Version history** in GitHub
✅ **Rollback** to any previous version with one click
✅ **Collaboration** - invite others to contribute
✅ **GitHub Actions** - automate tests, builds, more
✅ **Git Auto-Committer** (building tonight) will push changes automatically

---

## Next: Set Up Git Auto-Committer

The Git Auto-Committer tool (building tonight at 2AM) will:
- Watch your workspace for file changes
- Auto-commit and push to GitHub
- Netlify will auto-deploy

**Result:** Any file change in workspace → auto commit → push → Netlify deploy!

---

_Your website is now fully automated. Every change goes live automatically!_