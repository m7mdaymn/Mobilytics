# ⚡ Quick Deploy: 3 Commands

## 🚀 Push to Vercel in 3 Commands

```powershell
# 1. Stage all changes
git add .

# 2. Commit with message
git commit -m "feat: Add landing page and tenant resolver for root domain"

# 3. Push to GitHub (Vercel auto-deploys)
git push origin main
```

**That's it!** ✨

---

## 🔄 What Happens Next

```
1. GitHub receives push
   ↓
2. Vercel detects change
   ↓
3. Vercel builds Angular app (2-3 minutes)
   ↓
4. Live at: https://mobilytics.vercel.app/
```

---

## ✅ Test After Deploy

### In Browser:

```
https://mobilytics.vercel.app/          → Should show LANDING PAGE
https://mobilytics.vercel.app/?tenant=demo → Should load DEMO STORE
https://mobilytics.vercel.app/catalog   → Should show products
```

### What You Should See:

**Landing Page:**
- [ ] Mobilytics header with logo
- [ ] "Visit Demo Store" button
- [ ] "Browse All Stores" button
- [ ] Store selector grid
- [ ] Info cards & footer

**Demo Store Home:**
- [ ] Hero banner
- [ ] Theme switcher (top right)
- [ ] Featured products
- [ ] Navigation working
- [ ] Footer with store info

---

## ❌ If You Get 404

**Old behavior:** 404 on root domain ❌  
**New behavior:** Landing page ✅

If you still see 404:
1. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Wait 2-3 minutes for Vercel build to complete
3. Check Vercel dashboard for build errors

---

## 📊 What Changed

| Before | After |
|--------|-------|
| `https://mobilytics.vercel.app/` → 404 ❌ | Landing page ✅ |
| No way to select stores | Click to visit stores ✅ |
| Required URL param | Works with UI buttons ✅ |
| No visual guidance | Beautiful store selector ✅ |

---

## 🔐 Security

- ✅ Landing page is public (no auth needed)
- ✅ Storefront routes protected by guard
- ✅ Admin routes require auth
- ✅ Platform admin routes require platform auth

---

## 📝 Commit Message

Use this message (recommended):
```
feat: Add landing page and tenant resolver for root domain

- Create landing page component for store selection
- Add tenantResolverGuard to protect storefront routes
- Update routing to handle no-tenant scenario
- Fallback to demo store on landing page
```

---

## 🎯 Current Status

✅ Code ready  
✅ Build succeeds  
✅ Landing page tested locally  
⏳ Waiting for you to push!

---

## ⏭️ After Deploy

1. **Test landing page** (should work immediately)
2. **Implement backend endpoint** `/api/tenants/public` (optional but recommended)
3. **Add more tenants** in superadmin UI
4. **Test store selection** with different tenants

---

## 💡 Pro Tips

### Share Store URLs with Subdomains

```
# Send friends this link to visit demo store directly:
https://mobilytics.vercel.app/?tenant=demo

# When you create store1:
https://mobilytics.vercel.app/?tenant=store1
```

### Use Query Param in Emails/Docs

```markdown
[Visit Demo Store](https://mobilytics.vercel.app/?tenant=demo)
[Go to Store 1](https://mobilytics.vercel.app/?tenant=store1)
```

### Monitor Deployment

1. Push code: `git push origin main`
2. Go to: https://vercel.com/projects
3. Select your project
4. Watch build progress
5. See deployment logs

---

## 🚀 Ready?

```bash
git add . && git commit -m "feat: Add landing page" && git push origin main
```

**3 commands, 1 line!** 🎉

Visit `https://mobilytics.vercel.app/` in 2-3 minutes.
