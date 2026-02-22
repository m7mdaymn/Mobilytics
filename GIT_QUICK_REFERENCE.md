# 📚 Quick Git Commands Reference

## 🚀 First Time Setup

### Initialize Repository (if not done)
```bash
cd c:\DATA\SAASs\Mobilytics
git init
```

### Configure Git (first time only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Add Remote (connect to GitHub)
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Verify Remote
```bash
git remote -v
# Output should show:
# origin  https://github.com/YOUR_USERNAME/YOUR_REPO.git (fetch)
# origin  https://github.com/YOUR_USERNAME/YOUR_REPO.git (push)
```

---

## 📤 Push Code to GitHub (First Push)

```bash
# Stage all files
git add .

# Commit with message
git commit -m "Initial commit: Mobilytics platform with seeding & themes"

# Create main branch and push
git branch -M main
git push -u origin main
```

**Done!** Your code is now on GitHub and will auto-deploy to Vercel on changes.

---

## 🔄 Regular Workflow

### After Making Changes
```bash
# 1. See what changed
git status

# 2. Stage changes
git add .
# OR stage specific files:
git add src/app/pages/home/home.component.ts

# 3. Commit changes
git commit -m "Improve home page design"

# 4. Push to GitHub → Auto-triggers Vercel deploy
git push
```

---

## 🌿 Working with Branches

### Create Feature Branch
```bash
# Create and switch to new branch
git checkout -b feature/improve-theme-switcher

# Make changes...

# Commit changes
git add .
git commit -m "Add theme presets"

# Push branch to GitHub
git push -u origin feature/improve-theme-switcher
```

### Switch Branches
```bash
git checkout main              # Switch to main
git checkout feature/my-feature # Switch to feature branch
git branch                     # See all branches
```

### Merge and Delete Branch
```bash
git checkout main              # Go to main
git pull                       # Get latest
git merge feature/improve-theme-switcher  # Merge feature
git branch -d feature/improve-theme-switcher  # Delete old branch
git push                       # Push to GitHub
```

---

## 🔍 View History

### Recent Commits
```bash
git log                        # See commit history
git log --oneline              # Compact view
git log --oneline -5           # Last 5 commits
```

### Who Changed What
```bash
git blame src/app/component.ts # See who changed each line
```

### What Changed in a Commit
```bash
git show abc1234               # Details of specific commit
```

---

## 🆘 Undo Changes

### Before Committing
```bash
# Discard changes in working directory
git checkout -- src/app/component.ts

# Unstage changes
git reset HEAD src/app/component.ts

# Discard all local changes
git reset --hard HEAD
```

### After Committing
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo specific commit (create new commit)
git revert abc1234
```

---

## 📍 Tags & Releases

### Create Tag (for releases)
```bash
git tag v1.0.0                 # Create tag
git tag -a v1.0.0 -m "Version 1.0.0"  # With message
git push origin v1.0.0         # Push tag to GitHub
```

### List Tags
```bash
git tag                        # All tags
git tag -l "v1*"              # Tags matching pattern
```

---

## 🔄 Sync with Remote

### Fetch Latest Changes
```bash
git fetch origin               # Download changes (don't merge)
git pull                       # Download and merge changes
git pull origin main           # Pull specific branch
```

### Update Current Branch
```bash
git fetch origin
git rebase origin/main         # Update with latest main
```

---

## 📊 Status & Differences

### Check Status
```bash
git status                     # Show modified files
git status -s                  # Short format
```

### View Differences
```bash
git diff                       # Unstaged changes
git diff --staged              # Staged changes
git diff HEAD                  # All changes from last commit
git diff main..feature/branch  # Difference between branches
```

---

## 🚨 Common Mistakes & Fixes

### Committed to Wrong Branch
```bash
# Save the commit
git reset --soft HEAD~1

# Switch to correct branch
git checkout correct-branch

# Commit there
git commit -m "Your message"
```

### Pushed to Wrong Branch
```bash
# Revert the commit on wrong branch
git push origin +HEAD~1:wrong-branch

# Push to correct branch
git checkout correct-branch
git cherry-pick wrong-branch~1
git push
```

### Need to Edit Last Commit Message
```bash
git commit --amend -m "New message"
git push --force-with-lease    # Only if not pushed yet
```

### Want to Include Forgotten Change in Last Commit
```bash
git add forgotten-file.ts
git commit --amend --no-edit
git push --force-with-lease
```

---

## 🔐 Good Commit Messages

### Format
```
[Type] Subject

Type: feat, fix, docs, style, refactor, test, chore
Subject: Clear, concise, present tense

Examples:
  ✅ feat: Add theme switcher component
  ✅ fix: Fix settings not loading on public page
  ✅ docs: Update deployment guide
  ✅ refactor: Improve home page layout
```

### Examples
```bash
git commit -m "feat: Add theme switcher to header"
git commit -m "fix: Fix subdomain detection in TenantService"
git commit -m "docs: Update API documentation"
git commit -m "refactor: Improve responsive grid in home page"
```

---

## 🚀 GitHub → Vercel Deployment

### Auto-Deploy
1. Push to GitHub: `git push`
2. Vercel automatically detects change
3. Vercel builds and deploys (2-3 minutes)
4. Check deployment at: https://vercel.com/projects

### Manual Build Settings
```
Build Command:     ng build
Output Directory:  dist/frontend
Install Command:   npm ci
```

### View Deployment Logs
```
GitHub → Actions tab → See workflow logs
Vercel → Deployments tab → See build logs
```

---

## 📋 Step-by-Step: Your First Push

```bash
# 1. Navigate to project
cd c:\DATA\SAASs\Mobilytics

# 2. Check status
git status

# 3. Add all files
git add .

# 4. Commit with message
git commit -m "Initial commit: Mobilytics platform with seeding, themes, and improved UX"

# 5. Create main branch
git branch -M main

# 6. Push to GitHub
git push -u origin main

# Result:
# ✅ All code on GitHub
# ✅ Vercel auto-deploys
# ✅ Live at https://your-vercel-project.vercel.app
```

---

## 🎯 Day-to-Day Commands

```bash
# Every morning:
git pull                       # Get latest changes

# After making changes:
git add .
git commit -m "Describe your change"
git push                       # → Auto-deploys to Vercel!

# Before end of day:
git log --oneline -3           # See what you did
```

---

## 💡 Tips & Best Practices

✅ **Commit often** - Small, focused commits are better  
✅ **Good messages** - Describe WHY not just WHAT  
✅ **Pull before push** - Avoid conflicts  
✅ **Use branches** - Never develop on main  
✅ **Test before push** - Run `npm test` before committing  
✅ **Review diffs** - Use `git diff` to check changes  

---

## 🆘 Help Commands

```bash
git help                       # General help
git help add                   # Help for specific command
git status                     # Always helps!
```

---

**Ready to push? Follow the "Step-by-Step: Your First Push" section above! 🚀**
