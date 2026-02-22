# 🗺️ Complete Visual Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILYTICS PLATFORM                          │
│                  (Multi-Tenant E-Commerce)                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🌐 VERCEL HOSTING                  │
│  https://mobilytics.vercel.app/    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Angular Application (SPA)    │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ TenantResolverGuard     │  │  │
│  │  │ (Check if tenant set)   │  │  │
│  │  └─────────────────────────┘  │  │
│  │           ↓                   │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Landing Component       │  │  │
│  │  │ (No tenant: show this!) │  │  │
│  │  └─────────────────────────┘  │  │
│  │           ↓                   │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Storefront Shell        │  │  │
│  │  │ (Store home/catalog)    │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Admin Area (Protected)  │  │  │
│  │  │ authGuard required      │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Platform Admin (Auth)   │  │  │
│  │  │ platformAuthGuard req   │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
        ↓ API Calls
        │
┌─────────────────────────────────────┐
│  🖥️ BACKEND (.NET)                  │
│  Separate deployment (Azure/Heroku) │
│                                     │
│  ASP.NET Core REST API              │
│  - /api/tenants/public              │
│  - /api/items                       │
│  - /api/categories                  │
│  - /api/brands                      │
│  - /api/login                       │
│  - /api/admin/* (auth required)     │
│  - /api/superadmin/* (platform)     │
│                                     │
│  SQL Server Database                │
│  - Tenants table                    │
│  - Items, Categories, Brands        │
│  - Users, Roles                     │
│  - Store Settings                   │
└─────────────────────────────────────┘
```

---

## Request Flow Diagram

### Scenario 1: New User (No Tenant)

```
┌─────────────────────────────────────┐
│ User visits:                        │
│ https://mobilytics.vercel.app/     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Angular Router processes request    │
│ path: ''  (root)                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ tenantResolverGuard executes:      │
│                                     │
│ if (tenantService.resolved()) {    │
│   return true; // Allow            │
│ }                                   │
│ return router.createUrlTree(['/landing']) │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Redirect to: /landing              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Landing Component Loads:            │
│                                     │
│ ✅ Header with logo                │
│ ✅ Hero section                    │
│ ✅ Store grid                      │
│ ✅ Info cards                      │
│ ✅ How it works                    │
│ ✅ Footer                          │
│                                     │
│ API Call: GET /api/tenants/public  │
│ (Load list of stores)              │
└─────────────────────────────────────┘
```

### Scenario 2: User Selects Store

```
┌─────────────────────────────────────┐
│ User clicks:                        │
│ "Visit Demo Store" OR               │
│ Store card in grid                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Landing Component Handler:          │
│                                     │
│ visitStore(tenant: Tenant) {        │
│   tenantService.setOverride(slug)  │
│   router.navigate(['/'])            │
│ }                                   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ TenantService.setOverride():       │
│                                     │
│ localStorage.setItem(              │
│   'MOBILYTICS_TENANT_OVERRIDE',    │
│   'demo'                           │
│ )                                   │
│ this.resolve()                      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ TenantService resolves:            │
│ slug = 'demo' (from localStorage)  │
│ isValid = true                     │
│ resolved = true                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Router navigates to: /              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ tenantResolverGuard checks:        │
│ tenantService.resolved() === true  │
│ ✅ ALLOW ACCESS                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ StorefrontShell + HomeComponent    │
│ loads with tenant data:            │
│                                     │
│ SettingsStore loads:               │
│ - Store name, colors               │
│ - Logo, images                     │
│ - Phone, address                   │
│                                     │
│ API Calls:                         │
│ GET /api/tenants/{slug}            │
│ GET /api/settings                  │
│ GET /api/home-sections             │
│ GET /api/items (featured)          │
│                                     │
│ Home page renders with:            │
│ - Store branding                   │
│ - Products                         │
│ - Categories                       │
│ - Navigation                       │
└─────────────────────────────────────┘
```

### Scenario 3: Returning User (Store in LocalStorage)

```
┌──────────────────────────────────────┐
│ User returns to:                    │
│ https://mobilytics.vercel.app/     │
│ (Store was selected yesterday)      │
└────────────┬───────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ TenantService.resolve():            │
│                                      │
│ hostname = 'mobilytics.vercel.app'  │
│ → isFallbackDomain = true           │
│ slug = null (from hostname)         │
│                                      │
│ Check localStorage:                 │
│ MOBILYTICS_TENANT_OVERRIDE = 'demo' │
│ → slug = 'demo'                     │
│                                      │
│ Set signals:                        │
│ slug = 'demo'                       │
│ resolved = true                     │
└────────────┬───────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Router processes request: path ''   │
│                                      │
│ tenantResolverGuard.canActivate()  │
│ ✅ resolved() === true              │
│ ✅ ALLOW ACCESS                     │
└────────────┬───────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ StorefrontShell + HomeComponent    │
│                                      │
│ ✅ Load with demo store data        │
│ ✅ No redirection needed           │
│ ✅ Instant home page              │
└──────────────────────────────────────┘
```

---

## Guard Decision Tree

```
User tries to access: /catalog (or any storefront route)
│
└─ tenantResolverGuard.canActivate() is called
   │
   ├─ Check: tenantService.resolved() ?
   │
   ├─ TRUE ──────────────────────────┐
   │                                 │
   │                     ✅ RETURN TRUE
   │                     Allow navigation
   │                     User sees: Product catalog
   │
   └─ FALSE ─────────────────────────┐
                                     │
                                     ├─ Check: tenantService.isReserved() ?
                                     │  (www, api, admin, static)
                                     │
                                     ├─ isReserved = true
                                     │  ❌ Redirect to /landing
                                     │
                                     └─ isReserved = false
                                        ❌ Redirect to /landing
                                        User sees: Landing page
                                        User can select store
```

---

## Component Hierarchy

```
App
├─ Landing Component (route: /landing)
│  ├─ Header (logo, title)
│  ├─ Hero Section (welcome banner)
│  ├─ CTA Buttons (Visit Demo, Browse All)
│  ├─ Info Cards (3-column grid)
│  ├─ Store Grid
│  │  └─ Store Card (clickable) × N
│  ├─ How It Works (4 steps)
│  └─ Footer
│
├─ StorefrontShell (route: /, protected by tenantResolverGuard)
│  ├─ Header (logo, nav, mobile toggle)
│  ├─ RouterOutlet (content area)
│  │  ├─ Home Component (route: /)
│  │  │  ├─ Theme Switcher
│  │  │  ├─ Hero Banner
│  │  │  ├─ Home Sections (dynamic)
│  │  │  └─ Featured Products
│  │  │
│  │  ├─ Catalog Component (route: /catalog)
│  │  │  ├─ Filters
│  │  │  └─ Product Grid
│  │  │
│  │  ├─ Category Component (route: /category/:slug)
│  │  │  └─ Category Products
│  │  │
│  │  ├─ Brands Component (route: /brands)
│  │  │  └─ Brand Grid
│  │  │
│  │  ├─ Brand Detail (route: /brand/:slug)
│  │  │  └─ Brand Products
│  │  │
│  │  ├─ Item Detail (route: /item/:slug)
│  │  │  ├─ Product Info
│  │  │  ├─ Related Items
│  │  │  └─ Add to Cart
│  │  │
│  │  ├─ Compare Component (route: /compare)
│  │  │  └─ Comparison Table
│  │  │
│  │  └─ Policies Component (route: /policies/:key)
│  │     └─ Policy Content
│  │
│  └─ Footer (store info, links, map)
│
├─ Admin Login (route: /admin/login)
│  └─ Login Form
│
├─ Admin Layout (route: /admin, protected by authGuard)
│  ├─ Sidebar navigation
│  └─ Content area
│     ├─ Dashboard
│     ├─ Items Management
│     ├─ Categories
│     ├─ Brands
│     ├─ Home Sections
│     ├─ Invoices
│     ├─ Expenses
│     ├─ Employees
│     ├─ Leads
│     ├─ Settings
│     └─ Blocked Items
│
├─ Platform Login (route: /superadmin/login)
│  └─ Login Form
│
└─ Platform Layout (route: /superadmin, protected by platformAuthGuard)
   ├─ Sidebar navigation
   └─ Content area
      ├─ Dashboard
      ├─ Tenants (CRUD)
      ├─ Plans
      ├─ Subscriptions
      └─ Features
```

---

## Data Flow Diagram

```
┌─────────────────────────────┐
│  Browser (Single Page App)  │
│                             │
│  ┌─────────────────────┐    │
│  │  TenantService      │    │
│  │  (global state)     │    │
│  │                     │    │
│  │  slug$: Signal      │    │
│  │  resolved$: Signal  │    │
│  │  isValid$: Signal   │    │
│  └──────────┬──────────┘    │
│             │               │
│             ▼               │
│  ┌─────────────────────┐    │
│  │ SettingsStore       │    │
│  │ (store branding)    │    │
│  │                     │    │
│  │ settings$: Signal   │    │
│  │ storeName$: Signal  │    │
│  │ colors$: Signal     │    │
│  └──────────┬──────────┘    │
│             │               │
│             ▼               │
│  ┌─────────────────────┐    │
│  │  Components         │    │
│  │  (render UI)        │    │
│  │                     │    │
│  │  - Landing          │    │
│  │  - Home             │    │
│  │  - Catalog          │    │
│  │  - Admin            │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
          ↓ API Calls
          │
┌─────────────────────────────┐
│  Backend REST API           │
│  (ASP.NET Core)             │
│                             │
│  GET /api/tenants/public    │
│  GET /api/tenants/{slug}    │
│  GET /api/settings          │
│  GET /api/items             │
│  GET /api/categories        │
│  GET /api/home-sections     │
│  POST /api/login            │
│  POST /api/admin/*          │
│                             │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  SQL Server Database        │
│                             │
│  dbo.Tenants                │
│  dbo.Items                  │
│  dbo.Categories             │
│  dbo.Brands                 │
│  dbo.Users                  │
│  dbo.StoreSettings          │
│  dbo.HomeSections           │
│                             │
└─────────────────────────────┘
```

---

## localStorage Structure

```
Browser LocalStorage
│
├─ MOBILYTICS_TENANT_OVERRIDE: "demo"
│  └─ Set by: tenantService.setOverride()
│  └─ Used by: TenantService.resolve()
│  └─ Purpose: Persist store selection across page reloads
│
├─ auth_token: "eyJhbG..."
│  └─ Set by: API on login
│  └─ Used by: API interceptor
│  └─ Purpose: Authenticate admin requests
│
├─ theme_preference: "dark"
│  └─ Set by: Theme switcher
│  └─ Purpose: Remember dark/light mode
│
└─ ...other browser data

```

---

## File Size Breakdown

```
Frontend Bundle (production build)
│
├─ Initial Chunk: 391.98 kB
│  ├─ Polyfills: 34.58 kB
│  ├─ Main: 13.70 kB (core app logic)
│  ├─ Styles: 67.23 kB (CSS)
│  └─ Other chunks: ~276 kB (shared libraries)
│
└─ Lazy Chunks: (loaded only when needed)
   ├─ landing-component: 8.46 kB ← NEW!
   ├─ home-component: 15.89 kB
   ├─ item-detail-component: 13.60 kB
   ├─ item-form-component: 12.78 kB
   ├─ admin-settings-component: 12.02 kB
   ├─ subscriptions-component: 11.65 kB
   ├─ plans-component: 11.19 kB
   ├─ expenses-component: 11.08 kB
   ├─ storefront-shell-component: 9.71 kB
   └─ ...and 29 more chunks
```

---

## Deployment Pipeline

```
Local Development
│
└─ git add .
   git commit -m "message"
   git push origin main
         │
         ▼
GitHub Repository
│
└─ Webhook triggers Vercel
         │
         ▼
Vercel Build Server
│
├─ Checkout code
├─ Install dependencies: npm ci
├─ Build: ng build
│  ├─ Compile TypeScript
│  ├─ Bundle JavaScript
│  ├─ Generate static assets
│  └─ Optimize for production
├─ Deploy to CDN
│  └─ Distributed globally
│
└─ ✅ Production Live
   https://mobilytics.vercel.app/
```

---

## Success Indicators

```
✅ Landing page appears at root domain (no 404)
✅ Store selector grid shows available stores
✅ "Visit Demo Store" button works
✅ Demo store home page loads
✅ Products display with correct colors
✅ Navigation between pages works
✅ Mobile responsive
✅ No JavaScript errors in console
✅ localStorage persists store selection
✅ Theme switcher works
✅ Admin/superadmin routes protected
```

---

**This visual overview shows how all pieces fit together! 🎯**
