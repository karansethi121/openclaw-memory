# GitHub Setup for One4Health Website

## Step 1: Create GitHub Repository

**Go to:** https://github.com/new

**Fill in:**
- Repository name: `one4health-website`
- Description: One4Health wellness brand website
- Public/Private: **Public** (for Netlify free tier)
- ✅ Add a README file: **UNCHECK this** (we already have one)
- ✅ Add .gitignore: **UNCHECK this** (we already have files)
- ✅ Choose a license: **UNCHECK this** (add later if needed)

Click **"Create repository"**

---

## Step 2: Connect Your Local Git to GitHub

Once you create the repo, GitHub will show commands. Use this exact URL:

```
https://github.com/karan121333/one4health-website.git
```

**Run these commands in CMD/PowerShell:**

```bash
cd C:\Users\Karan\.openclaw\workspace\one4health-website
git remote add origin https://github.com/karan121333/one4health-website.git
git branch -M main
git push -u origin main
```

**First push only:** GitHub may ask for **Personal Access Token** instead of password. Here's how to get it:

---

## Step 3: Create GitHub Personal Access Token

**Why:** GitHub no longer accepts passwords for git push. You need a token.

**Steps:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Token name: `One4Health Website Deploy`
4. Expiration: Choose `No expiration` or `90 days`
5. Select scopes:
   - ✅ **repo** (full control of private repositories)
   - ✅ **workflow** (for GitHub Actions)
6. Click "Generate token"
7. **COPY THE TOKEN** - you won't see it again!

Save it somewhere safe. You'll use it as your password when git asks.

---

## Step 4: Push to GitHub

When prompted:
- **Username:** `karan121333`
- **Password:** `<paste your Personal Access Token>`

```bash
git push -u origin main
```

---

## Step 5: Connect Netlify to GitHub (Auto-Deploy)

**Option A: Netlify Dashboard**

1. Go to: https://app.netlify.com
2. Sign in to your Netlify account
3. Click "Add new site" → "Import an existing project"
4. Select **GitHub**
5. Authorize Netlify to access your GitHub
6. Select `one4health-website` repository
7. Build settings:
   - **Base directory:** Leave empty
   - **Build command:** Leave empty (static HTML, no build needed)
   - **Publish directory:** Leave empty (root directory)
8. Click "Deploy site"

**Result:** Every push to GitHub → Auto deploy to Netlify! ✨

---

## Option B: Netlify CLI (Faster)

If you already have `netlify-cli` installed:

```bash
npm install -g netlify-cli
cd C:\Users\Karan\.openclaw\workspace\one4health-website
netlify login
netlify init
```

Follow the prompts to connect to the existing Netlify site.

---

## Step 6: Test the Connection

**Try this:**
1. Make a small change to `index.html` (e.g., update the title)
2. Commit: `git add . && git commit -m "Test update"`
3. Push: `git push`
4. Wait 30-60 seconds
5. Refresh https://one4health.netlify.app/

**If it works:** You'll see your change live within a minute! 🎉

---

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/karan121333/one4health-website.git
```

### Git asks for username/password repeatedly
Use credential helper:
```bash
git config --global credential.helper wincred
```

### Netlify build fails
Make sure you selected the correct publish directory. Since this is static HTML with no build step, leave it empty.

---

## What This Gives You

✅ Every file change → git commit → git push → auto deploy
✅ Version history of your website
✅ Rollback to any previous version
✅ Multiple collaborators (if needed in future)
✅ GitHub Actions for automation
✅ GitHub Issues for tracking bugs

---

_Ready to start building! Push your first commit now._