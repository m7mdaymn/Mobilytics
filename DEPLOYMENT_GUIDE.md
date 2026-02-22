# 🚀 Git & Vercel Deployment Guide

## 📁 Step 1: Prepare Repository for Git

### 1.1 Initialize Git (if not already done)
```bash
cd c:\DATA\SAASs\Mobilytics
git init
```

### 1.2 Add and Commit Files
```bash
# Add all files
git add .

# Commit initial version
git commit -m "Initial commit: Mobilytics platform with seeded data, theme switcher, and improved home page"
```

### 1.3 Add Remote Repository
```bash
# Replace YOUR_USERNAME and YOUR_REPO with your GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Verify remote
git remote -v
```

### 1.4 Push to GitHub
```bash
# Create main branch and push
git branch -M main
git push -u origin main
```

---

## 🔐 What Gets Ignored (from .gitignore)

```
✅ bin/, obj/ - Build artifacts
✅ node_modules/ - NPM packages
✅ .env files - Secrets/credentials
✅ appsettings.Development.json - Local config
✅ logs/ - Application logs
✅ .DS_Store, Thumbs.db - OS files
✅ *.db, *.sqlite - Local database files
✅ .vscode/, .idea/ - IDE settings
✅ dist/, publish/ - Build outputs
```

---

## 📦 Vercel Deployment - Frontend Only

**Why?** Backend (.NET) runs on Azure/Heroku, Frontend (Angular SPA) runs on Vercel.

### Step 1: Push Frontend to GitHub

```bash
# Option A: Separate frontend repo
mkdir mobilytics-frontend
cd mobilytics-frontend
cp -r ../Mobilytics/frontend/* .
git init
git add .
git commit -m "Frontend: Mobilytics SPA"
git remote add origin https://github.com/YOUR_USERNAME/mobilytics-frontend.git
git push -u origin main

# Option B: Monorepo (keep both in same repo)
# Already done if you pushed entire Mobilytics folder
```

### Step 2: Create Vercel Project

**Method A: CLI**
```bash
cd frontend
npm install -g vercel
vercel login
vercel
# Follow prompts to connect GitHub repo
```

**Method B: Web Dashboard**
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Select your GitHub repo
5. Configure:
   - Framework Preset: **Angular**
   - Build Command: `ng build`
   - Output Directory: `dist/frontend`
   - Install Command: `npm ci`

### Step 3: Environment Variables on Vercel

1. Go to Project Settings → Environment Variables
2. Add:
   ```
   ANGULAR_ENVIRONMENT_PRODUCTION=true
   API_BASE_URL=https://your-backend-api.com
   APP_DOMAIN=your-domain.com
   ```

### Step 4: Deploy
```bash
# Auto-deploys on git push to main
# Or manually:
vercel --prod
```

---

## 🌍 Handling Subdomains on Vercel

### Architecture

```
Your Domain: example.com

Tenant Subdomains:
  demo.example.com       → Same Angular app (same Vercel project)
  store1.example.com     → Same Angular app
  store2.example.com     → Same Angular app
  admin.example.com      → Admin dashboard (same app)
  www.example.com        → Main landing page (same app)

Backend API:
  api.example.com        → ASP.NET Core (separate server)
```

### Step 1: Configure Custom Domain on Vercel

1. **Go to**: Project Settings → Domains
2. **Add Domain**: `example.com`
3. **Vercel shows DNS records**:
   ```
   Type: CNAME
   Name: example.com
   Value: cname.vercel.sh
   TTL: 3600
   ```
4. **Add DNS Records** at your domain provider (GoDaddy, Namecheap, etc.):
   ```
   example.com A → 76.76.19.21
   *.example.com CNAME → cname.vercel.sh
   ```

### Step 2: Wildcard DNS for Subdomains

At your DNS provider, add:
```
*.example.com CNAME cname.vercel.sh
```

This makes ALL subdomains point to Vercel:
- `demo.example.com` ✅
- `store1.example.com` ✅
- `store2.example.com` ✅
- Any subdomain automatically works!

### Step 3: Update Frontend to Handle Subdomains

**Already done in TenantService!** Just verify:

```typescript
// src/app/core/services/tenant.service.ts

extractFromHostname(): string | null {
  const hostname = window.location.hostname;
  
  // localhost or IP => no subdomain
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split('.');
  // Expects: slug.example.com (3+ parts)
  // Extracts: "slug" from "slug.example.com"
  if (parts.length >= 3) {
    return parts[0].toLowerCase();
  }

  // example.com (2 parts) => no tenant
  return null;
}
```

### Step 4: Update Backend API CORS

**In `Program.cs`**:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSubdomains", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "https://example.com",
                "https://*.example.com",    // Any subdomain ✅
                "https://vercel-deployment.vercel.app"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

app.UseCors("AllowSubdomains");
```

### Step 5: API Base URL Configuration

**For different environments:**

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000',
  appDomain: 'localhost'
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.example.com',  // Backend API
  appDomain: 'example.com'
};
```

**Angular auto-selects based on build:**
```bash
ng build                    # Uses environment.ts
ng build --configuration=production  # Uses environment.prod.ts
```

---

## 🔄 Git Workflow

### Initial Push
```bash
cd c:\DATA\SAASs\Mobilytics
git init
git add .
git commit -m "Initial: Platform with seeding & theme switcher"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Regular Updates
```bash
# Make changes...
git status                # See what changed
git add .                # Stage all changes
git commit -m "Your message here"   # Commit
git push                 # Push to GitHub → Auto-deploys to Vercel!
```

### Create Feature Branch
```bash
git checkout -b feature/theme-improvements
# ... make changes ...
git add .
git commit -m "Add theme improvements"
git push -u origin feature/theme-improvements
# Then create Pull Request on GitHub
```

---

## 📋 DNS Configuration Example (GoDaddy)

1. **Login to GoDaddy**
2. **Go to DNS Manager**
3. **Add Records**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.19.21 | 3600 |
| CNAME | * | cname.vercel.sh | 3600 |
| CNAME | api | your-backend-api.com | 3600 |

### Result:
- `example.com` → Vercel (Angular app)
- `demo.example.com` → Vercel (Angular app with demo tenant)
- `store1.example.com` → Vercel (Angular app with store1 tenant)
- `api.example.com` → Your backend API

---

## 🧪 Test Subdomains Locally

### Before Deployment, Test Locally:

```bash
# Edit hosts file: C:\Windows\System32\drivers\etc\hosts
# Add:
127.0.0.1 localhost
127.0.0.1 demo.localhost
127.0.0.1 store1.localhost

# Then access:
http://localhost:4200
http://demo.localhost:4200
http://store1.localhost:4200
```

Frontend TenantService will extract:
- From `localhost` → use query param/localStorage
- From `demo.localhost` → extract "demo" as slug
- From `store1.localhost` → extract "store1" as slug

---

## 📊 Deployment Checklist

```
Frontend (Vercel):
  ✅ GitHub repo created
  ✅ Vercel project connected
  ✅ Environment variables set
  ✅ Custom domain configured
  ✅ Wildcard DNS records added (*.example.com)
  ✅ Build preview shows no errors
  ✅ Production deployment successful

Backend (Your Server):
  ✅ Deployed to Azure / Heroku / AWS
  ✅ CORS configured for all subdomains
  ✅ Environment variables set (DB, secrets)
  ✅ Database seeded
  ✅ API accessible at api.example.com

Integration:
  ✅ Frontend API_BASE_URL points to backend
  ✅ Backend CORS allows frontend origin
  ✅ Subdomain extraction works (demo.example.com → "demo")
  ✅ Settings load from API
  ✅ Colors apply on subdomain access
```

---

## 🐛 Troubleshooting Subdomains

### Issue 1: Subdomain shows 404
**Solution:**
```
1. Check DNS: nslookup demo.example.com
   Should resolve to Vercel IP
2. Check Vercel settings: Should allow all domains
3. Vercel → Settings → Domains → Add if missing
```

### Issue 2: Tenant not detected
**Solution:**
```typescript
// Browser console check:
TenantService.slug()        // Should return "demo"
TenantService.resolved()    // Should be true
```

### Issue 3: API CORS error
**Solution:**
```
1. Check backend CORS policy
2. Ensure *.example.com allowed
3. Verify API_BASE_URL in environment.prod.ts
4. Browser console → Network tab → Check error response
```

### Issue 4: Settings not loading
**Solution:**
```javascript
// Browser console:
const settings = settingsStore.settings()
console.log(settings)  // Should have data
// If null, check:
// 1. API returns 200 status
// 2. X-Tenant-Slug header sent
// 3. Backend has demo tenant
```

---

## 🎯 Complete Deployment Flow

```
1. Local Development
   npm start → Works on localhost:4200

2. Push to GitHub
   git push → Changes go to GitHub

3. Vercel Auto-Deploy
   Vercel sees GitHub push
   → Builds Angular app
   → Deploys to vercel.sh
   → Available at https://project.vercel.app

4. Custom Domain
   Add example.com in Vercel settings
   → Points to Vercel deployment
   → Available at https://example.com

5. Subdomains
   DNS has *.example.com → Vercel
   → demo.example.com works automatically
   → store1.example.com works automatically
   → TenantService extracts slug from subdomain

6. Backend
   Separate server (Azure/Heroku)
   → Environment variable: API_BASE_URL
   → Frontend calls: https://api.example.com
```

---

## ✨ Final Configuration

**Vercel Project Settings:**
```
Build Command:     ng build
Output Directory:  dist/frontend
Install Command:   npm ci
Node Version:      18.x (or latest)
```

**Environment Variables (Vercel):**
```
API_BASE_URL=https://api.example.com
APP_DOMAIN=example.com
ENVIRONMENT=production
```

**Backend CORS (Program.cs):**
```csharp
.WithOrigins("https://*.example.com")
```

**DNS:**
```
*.example.com  CNAME  cname.vercel.sh
```

Everything is ready! 🎉
