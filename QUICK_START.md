# Quick Reference - Seeded Data & Features

## 🔑 Login Credentials

### Platform Super Admin
```
Email: admin@novanode.com
Password: Admin@123
Route: http://localhost:4200/superadmin/login
```

### Demo Tenant Admin
```
Email: owner@demo.com
Password: Demo@123
Route: http://localhost:4200/admin/login?tenant=demo
```

---

## 📱 Accessing the Demo Storefront

### Method 1: Set Tenant Override (Easiest)
```javascript
// In browser console:
localStorage.setItem('MOBILYTICS_TENANT_OVERRIDE', 'demo')
location.reload()
http://localhost:4200
```

### Method 2: URL Parameter
```
http://localhost:4200?tenant=demo
```

---

## 🎯 What's Seeded

| Item | Count | Status |
|------|-------|--------|
| Brands | 5 | ✅ Active |
| Categories | 5 | ✅ Active |
| Products | 6 | ✅ Featured |
| Home Sections | 4 | ✅ Active |
| Item Types | 4 | ✅ Active |
| Store Settings | 1 | ✅ Configured |

### Products in Demo Store
1. iPhone 15 Pro Max - 24,999 EGP
2. Samsung Galaxy S24 - 23,999 EGP
3. iPad Air 11 - 15,999 EGP
4. MacBook Pro 16 - 49,999 EGP
5. Sony WH-1000XM5 - 3,999 EGP
6. USB-C Cable 2m - 89 EGP

---

## 🎨 New Features

### Theme Switcher
- Location: Top-right of storefront
- Features: Color picker, 6 presets, save to backend
- Access: Click "🎨 Theme" button

### Home Page Improvements
- Hero banner with CTA
- Product grid (responsive)
- Category showcase (5 categories)
- Brand carousel (5 brands)
- Call-to-action sections
- Smooth animations
- Dark mode support

---

## 🔍 Testing Checklist

```
□ Set DEMO_SEED=true on backend
□ Run backend (dotnet run)
□ Run frontend (npm start)
□ Set tenant override: localStorage.setItem('MOBILYTICS_TENANT_OVERRIDE', 'demo')
□ Visit http://localhost:4200
□ See "TechHub Electronics" in header
□ See theme switcher button
□ See hot deals banner
□ See featured products
□ See categories grid
□ See brands carousel
□ Click theme switcher
□ Change colors
□ Click "Save Theme"
□ Refresh page
□ Theme persists ✅
```

---

## 🚀 Quick Start

```bash
# Terminal 1 - Backend
cd src/NovaNode.Api
$env:DEMO_SEED = "true"
dotnet run

# Terminal 2 - Frontend
cd frontend
npm start
```

Then in browser console:
```javascript
localStorage.setItem('MOBILYTICS_TENANT_OVERRIDE', 'demo')
```

Visit: http://localhost:4200

---

## 📊 Architecture

### Settings Flow
```
Public Page
  ↓
SettingsStore.loadSettings()
  ↓
GET /api/v1/Public/settings
  ↓
Backend returns StoreSettings
  ↓
applyTheme() sets CSS variables
  ↓
Page renders with custom colors
```

### Home Page Flow
```
HomeComponent.ngOnInit()
  ├─→ GET /Public/sections → HomeSections[]
  ├─→ GET /Public/items?isFeatured=true → Featured Items
  └─→ GET /Public/items?sortBy=createdAt → New Arrivals
       ↓
   Display with responsive grid
   Colors from CSS variables
   Animations from Tailwind
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| All pages show "tenant-not-found" | Set localStorage['MOBILYTICS_TENANT_OVERRIDE'] = 'demo' |
| No products showing | Verify DEMO_SEED=true was set before running backend |
| Settings colors not applied | Check CSS variables: `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')` |
| Theme switcher not working | Ensure SettingsStore loads settings on init |
| Home sections missing | Verify GET /Public/sections returns 4 items with isActive=true |
| Database empty | Delete DB and re-run migration with DEMO_SEED=true |

---

## 📝 Files Created/Modified

### Backend
- `src/NovaNode.Infrastructure/Seeding/DatabaseSeeder.cs` - Rich demo data

### Frontend
- `frontend/src/app/public/pages/home/home.component.ts` - Improved UI
- `frontend/src/app/shared/components/theme-switcher/theme-switcher.component.ts` - NEW
- `frontend/src/environments/environment.ts` - Updated

---

**Everything is ready to test! 🎉**

See `SEEDED_DATA_GUIDE.md` for detailed documentation.
