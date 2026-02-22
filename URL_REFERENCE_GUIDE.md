# 🌐 URL Reference & Visual Guide

## 📍 All Available URLs Post-Deployment

### Public/Storefront URLs

| URL | Purpose | What You See | Auth Required |
|-----|---------|--------------|---------------|
| `https://mobilytics.vercel.app/` | Home page | **Landing page** (if no store selected) or **Store home** | ❌ No |
| `https://mobilytics.vercel.app/landing` | Store selector | Landing page with store grid | ❌ No |
| `https://mobilytics.vercel.app/?tenant=demo` | Quick access | Auto-load demo store home | ❌ No |
| `https://mobilytics.vercel.app/?tenant=SLUG` | Any store | Load specific store | ❌ No |
| `https://mobilytics.vercel.app/catalog` | Product listing | All products (requires store) | ❌ No |
| `https://mobilytics.vercel.app/category/SLUG` | Category | Products in category | ❌ No |
| `https://mobilytics.vercel.app/brands` | Brand listing | All brands | ❌ No |
| `https://mobilytics.vercel.app/item/SLUG` | Product detail | Single product info | ❌ No |
| `https://mobilytics.vercel.app/compare` | Comparison | Compare selected items | ❌ No |
| `https://mobilytics.vercel.app/policies/POLICY` | Legal | Terms, warranty, return | ❌ No |

### Admin URLs

| URL | Purpose | What You See | Auth Required |
|-----|---------|--------------|---------------|
| `https://mobilytics.vercel.app/admin/login` | Tenant login | Login form (username/password) | ❌ No |
| `https://mobilytics.vercel.app/admin` | Dashboard | Admin dashboard | ✅ Yes (Tenant) |
| `https://mobilytics.vercel.app/admin/items` | Items management | CRUD for products | ✅ Yes (Tenant) |
| `https://mobilytics.vercel.app/admin/categories` | Categories | Manage categories | ✅ Yes (Tenant) |
| `https://mobilytics.vercel.app/admin/brands` | Brands | Manage brands | ✅ Yes (Tenant) |
| `https://mobilytics.vercel.app/admin/invoices` | Invoices | Sales/invoices | ✅ Yes (Tenant) |
| `https://mobilytics.vercel.app/admin/settings` | Store settings | Color picker, info, etc. | ✅ Yes (Tenant) |

### Platform Admin URLs

| URL | Purpose | What You See | Auth Required |
|-----|---------|--------------|---------------|
| `https://mobilytics.vercel.app/superadmin/login` | Platform login | Login form | ❌ No |
| `https://mobilytics.vercel.app/superadmin` | Dashboard | Platform dashboard | ✅ Yes (Platform) |
| `https://mobilytics.vercel.app/superadmin/tenants` | Manage tenants | Create/edit stores | ✅ Yes (Platform) |
| `https://mobilytics.vercel.app/superadmin/plans` | Manage plans | Pricing plans | ✅ Yes (Platform) |
| `https://mobilytics.vercel.app/superadmin/subscriptions` | Subscriptions | Store subscriptions | ✅ Yes (Platform) |
| `https://mobilytics.vercel.app/superadmin/features` | Features | Feature management | ✅ Yes (Platform) |

---

## 🎨 Visual Flow

### Scenario 1: First-Time User on Root Domain

```
1. User navigates to: https://mobilytics.vercel.app/
   
   ↓ (TenantResolverGuard checks: Is tenant set?)
   
2. Guard finds: NO TENANT SET
   
   ↓ (Redirect to landing page)
   
3. Browser shows: https://mobilytics.vercel.app/landing
   
4. USER SEES:
   ┌─────────────────────────────────────────────┐
   │ 🏪 MOBILYTICS - Multi-Store Platform       │
   ├─────────────────────────────────────────────┤
   │                                             │
   │   Discover Amazing Stores                  │
   │   ✨ Welcome to Mobilytics                 │
   │                                             │
   │   [🚀 Visit Demo Store]  [📖 Browse All]   │
   │                                             │
   ├─────────────────────────────────────────────┤
   │  🛍️  📦 Quality Products  🔒 Secure & Fast │
   ├─────────────────────────────────────────────┤
   │                                             │
   │  Available Stores:                          │
   │  ┌─────────┬─────────┬─────────┐           │
   │  │ DEMO    │ STORE1  │ STORE2  │           │
   │  └─────────┴─────────┴─────────┘           │
   │                                             │
   │  How It Works:                              │
   │  1️⃣ Choose Store 2️⃣ Browse 3️⃣ Add 4️⃣ Buy │
   │                                             │
   └─────────────────────────────────────────────┘
```

### Scenario 2: User Clicks "Visit Demo Store"

```
1. User clicks: [🚀 Visit Demo Store]
   
   ↓ (JavaScript event handler)
   
2. App calls: tenantService.setOverride('demo')
   
   ↓ (Sets localStorage.MOBILYTICS_TENANT_OVERRIDE = 'demo')
   
3. Router navigates to: https://mobilytics.vercel.app/
   
   ↓ (TenantResolverGuard checks: Is tenant set?)
   
4. Guard finds: TENANT = 'demo' in localStorage
   
   ↓ (Allow access)
   
5. APP LOADS DEMO STORE HOME:
   ┌─────────────────────────────────────────────┐
   │ LOGO | Home | Catalog | Brands | Compare    │
   ├─────────────────────────────────────────────┤
   │                                             │
   │   Welcome to Tech Store ™ Switcher         │
   │                                             │
   │   [Shop Now →]                             │
   │                                             │
   ├─────────────────────────────────────────────┤
   │  Featured Products:                         │
   │  ┌──────────┬──────────┬──────────┐         │
   │  │ iPhone   │ Galaxy   │ iPad     │         │
   │  └──────────┴──────────┴──────────┘         │
   │                                             │
   │  Categories  |  Brands  |  Testimonials    │
   │                                             │
   └─────────────────────────────────────────────┘
```

### Scenario 3: User Navigates Via URL with Query Param

```
1. User clicks link: https://mobilytics.vercel.app/?tenant=demo
   
   ↓ (Page loads)
   
2. TenantService.resolve() detects:
   - URL: mobilytics.vercel.app → FALLBACK DOMAIN
   - Query param: ?tenant=demo → SET tenant
   - localStorage: stores tenant for persistence
   
3. Router processes routing
   
   ↓ (TenantResolverGuard checks)
   
4. Guard finds: TENANT = 'demo'
   
   ↓ (Allow access)
   
5. Home page loads with demo store data
```

---

## 🔐 Authentication Flows

### Tenant Admin Login

```
User wants admin access:

1. Navigates to: https://mobilytics.vercel.app/admin/login
   
   ↓ (Login form shows)
   
2. Enters: Email: owner@demo.com, Password: Demo@123
   
   ↓ (API call to /login)
   
3. Backend validates & returns JWT token
   
   ↓ (Token stored in localStorage)
   
4. Router redirects to: https://mobilytics.vercel.app/admin
   
   ↓ (authGuard checks token)
   
5. Admin dashboard loads
```

### Platform Super Admin Login

```
User wants platform admin access:

1. Navigates to: https://mobilytics.vercel.app/superadmin/login
   
   ↓ (Platform login form)
   
2. Enters: Email: admin@novanode.com, Password: Admin@123
   
   ↓ (API call to /login)
   
3. Backend validates platform user
   
   ↓ (Token stored in localStorage)
   
4. Router redirects to: https://mobilytics.vercel.app/superadmin
   
   ↓ (platformAuthGuard checks)
   
5. Platform dashboard loads
```

---

## 🚀 Quick Test URLs

### Test Landing Page
```
https://mobilytics.vercel.app/landing
```
Expected: Store selector grid visible

### Test Auto-Load Demo Store
```
https://mobilytics.vercel.app/?tenant=demo
```
Expected: Home page loads with "Demo Store" branding

### Test Catalog
```
https://mobilytics.vercel.app/catalog
```
Expected: Product list (requires ?tenant=demo or store selected)

### Test Item Detail
```
https://mobilytics.vercel.app/item/iphone-15
```
Expected: Single product details (requires valid item slug)

### Test Admin Login
```
https://mobilytics.vercel.app/admin/login
```
Expected: Login form (no auth required)

### Test Admin Dashboard
```
https://mobilytics.vercel.app/admin
```
Expected: Redirects to login if no auth, dashboard if authenticated

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  User visits: https://mobilytics.vercel.app/       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ TenantService.resolve│
        └──────┬───────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Check hostname/query/storage │
        └──────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼ Found Tenant        ▼ No Tenant
    │                     │
    ▼                     ▼ Redirect to /landing
    Tenant Service        ┌──────────────────┐
        set              │ Landing Component │
    │                     └──────┬───────────┘
    │                           │
    ▼                           ▼
┌─────────────────┐      [User selects store]
│ TenantResolver  │           │
│ Guard           │ ┌─────────┘
│ (allows access) │ │
└────┬────────────┘ │
     │              │
     ▼              ▼
┌──────────────┐   │
│ StoreFront   │◄──┘
│ Shell        │
└────┬─────────┘
     │
     ▼
┌──────────────────┐
│ Home Component   │
│ + SettingsStore  │
│ (loads colors,   │
│  products, etc)  │
└──────────────────┘
```

---

## 🔄 Route Hierarchy

```
Root (/)
│
├─ /landing (PUBLIC)
│   └─ Landing Component (store selector)
│
├─ / (PROTECTED by tenantResolverGuard)
│   └─ StorefrontShell
│       ├─ / (Home)
│       ├─ /catalog (Catalog)
│       ├─ /category/:slug (Category)
│       ├─ /brands (Brands)
│       ├─ /item/:slug (Item Detail)
│       ├─ /compare (Compare)
│       └─ /policies/:key (Policies)
│
├─ /admin/login (PUBLIC)
│   └─ Admin Login Form
│
├─ /admin (PROTECTED by authGuard)
│   └─ AdminLayout
│       ├─ Dashboard
│       ├─ /items, /items/:id/edit
│       ├─ /categories, /brands
│       ├─ /invoices, /expenses
│       ├─ /employees, /leads
│       └─ /settings
│
├─ /superadmin/login (PUBLIC)
│   └─ Platform Login Form
│
└─ /superadmin (PROTECTED by platformAuthGuard)
    └─ PlatformLayout
        ├─ Dashboard
        ├─ /tenants (CRUD tenants)
        ├─ /plans (Manage plans)
        ├─ /subscriptions (Subscriptions)
        └─ /features (Feature management)
```

---

## 🎯 User Journey Examples

### Journey 1: Browse Demo Store

```
START: https://mobilytics.vercel.app/
  ↓
REDIRECT: /landing (no tenant)
  ↓
CLICK: "Visit Demo Store"
  ↓
HOME: https://mobilytics.vercel.app/ (tenant set to 'demo')
  ↓
CLICK: "Catalog"
  ↓
CATALOG: /catalog (list all items)
  ↓
CLICK: "iPhone 15" product
  ↓
DETAIL: /item/iphone-15 (product info & settings color)
  ↓
END: User sees product with store's custom colors & branding
```

### Journey 2: Admin Manages Store

```
START: https://mobilytics.vercel.app/admin/login
  ↓
ENTER: owner@demo.com / Demo@123
  ↓
DEFAULT: /admin (dashboard)
  ↓
CLICK: "Items"
  ↓
LIST: /admin/items (all products)
  ↓
CLICK: Edit button
  ↓
EDIT: /admin/items/id/edit (edit product)
  ↓
SAVE: Updates product
  ↓
BACK: /admin/items (list)
```

### Journey 3: Platform Admin Creates Store

```
START: https://mobilytics.vercel.app/superadmin/login
  ↓
ENTER: admin@novanode.com / Admin@123
  ↓
DEFAULT: /superadmin (platform dashboard)
  ↓
CLICK: "Tenants"
  ↓
LIST: /superadmin/tenants (all stores)
  ↓
CLICK: "Create"
  ↓
FORM: /superadmin/tenants/create (new store form)
  ↓
SAVE: Store created, slug = 'newstore'
  ↓
RESULT: Users can now visit: ?tenant=newstore
```

---

## 📱 Responsive Behavior

All URLs work on:
- ✅ Desktop (full width)
- ✅ Tablet (adaptive columns)
- ✅ Mobile (single column, touch-friendly)

---

## 🔗 External Links

**From Landing Page:**
```
[Visit Mobilytics] → External link to marketing site (if set)
Social media links from store settings
Contact info from store settings
```

**From Store Pages:**
```
Policies links: /policies/about, /policies/warranty, /policies/return
External brand links: Store settings
```

---

## 🆘 Common Redirects

| If User Tries | They Get Redirected To |
|---------------|------------------------|
| `/admin` (not logged in) | `/admin/login` |
| `/superadmin` (not logged in) | `/superadmin/login` |
| `/` (no tenant set) | `/landing` |
| `/any-route-that-doesnt-exist` | `/` (then landing if no tenant) |
| `/inactive` (tenant is inactive) | Inactive banner |

---

**Ready to test? Deploy and visit these URLs!** 🚀
