# Settings & Configuration Debugging Guide

## 🔍 Verify Backend Settings

### Check Database
```sql
-- View demo tenant settings
SELECT * FROM StoreSettings 
WHERE TenantId IN (SELECT Id FROM Tenants WHERE Slug='demo');

-- View all seeded data
SELECT * FROM Tenants WHERE Slug='demo';
SELECT * FROM Categories WHERE TenantId IN (SELECT Id FROM Tenants WHERE Slug='demo');
SELECT * FROM Brands WHERE TenantId IN (SELECT Id FROM Tenants WHERE Slug='demo');
SELECT * FROM Items WHERE TenantId IN (SELECT Id FROM Tenants WHERE Slug='demo');
SELECT * FROM HomeSections WHERE TenantId IN (SELECT Id FROM Tenants WHERE Slug='demo');
```

### Check API Response
```bash
# Terminal
curl -X GET "http://localhost:5000/api/v1/Public/settings?tenant=demo" \
  -H "X-Tenant-Slug: demo"

# Expected response:
{
  "success": true,
  "data": {
    "id": 1,
    "tenantId": 1,
    "storeName": "TechHub Electronics",
    "currency": "EGP",
    "primaryColor": "#2563eb",
    "secondaryColor": "#64748b",
    "accentColor": "#f97316",
    "logoUrl": null,
    "address": null,
    "phone": null,
    "workingHours": null,
    "isActive": true,
    "theme": 1,
    "pwaShortName": "TechHub",
    "pwaDescription": "Your Ultimate Tech Store",
    "canRemovePoweredBy": true,
    "showPoweredBy": false
  }
}
```

---

## 🧪 Verify Frontend Settings Loading

### Browser Console Checks

```javascript
// 1. Check if TenantService resolved the slug
console.log('Tenant slug:', tenantService.slug())
// Should output: "demo"

// 2. Check if SettingsStore loaded settings
console.log('Settings loaded:', settingsStore.settings())
// Should output: { storeName: 'TechHub Electronics', ... }

// 3. Check if CSS variables applied
const root = getComputedStyle(document.documentElement);
console.log('Primary color:', root.getPropertyValue('--color-primary').trim())
// Should output: "#2563eb"

// 4. Check all color variables
console.log({
  primary: root.getPropertyValue('--color-primary').trim(),
  secondary: root.getPropertyValue('--color-secondary').trim(),
  accent: root.getPropertyValue('--color-accent').trim()
})

// 5. Verify theme class on body
console.log('Body classes:', document.body.className)
// Should include: "theme-1"

// 6. Check if store name in DOM
console.log('Store name in title:', document.title)
// Should output: "TechHub Electronics | Mobilytics"
```

---

## 📊 Network Request Monitoring

### Check Network Tab
1. Open DevTools → Network tab
2. Reload page with tenant parameter
3. Look for:

```
GET /api/v1/Public/settings
  Status: 200 OK
  Response headers:
    Content-Type: application/json
  Response body:
    {
      "success": true,
      "data": { storeName: "TechHub Electronics", ... }
    }

GET /api/v1/Public/sections
  Status: 200 OK
  Response body: [4 sections with isActive: true]

GET /api/v1/Public/items?isFeatured=true
  Status: 200 OK
  Response: Items array with images
```

---

## 🎯 Settings Display Verification

### What Should Display on Public Page

#### Header
- ✅ Store name: "TechHub Electronics"
- ✅ Logo (if set)
- ✅ Navigation menu
- ✅ Theme switcher button (🎨)

#### Hero Section
- ✅ Gradient background in primary color
- ✅ "Welcome to TechHub Electronics"
- ✅ "Shop Now" CTA button

#### Content Sections
- ✅ Hot Deals banner
- ✅ Featured Products (6 items)
- ✅ Categories showcase (5 categories)
- ✅ Brands carousel (5 brands)

#### Colors Applied
- ✅ Primary: #2563eb (Blue)
- ✅ Secondary: #64748b (Slate)
- ✅ Accent: #f97316 (Orange)

#### Footer
- ✅ Store name
- ✅ Support phone: +201000000000
- ✅ Support WhatsApp: +201000000000

---

## 🔧 Debug Settings Component

Add this debug section to any component to verify settings:

```typescript
import { Component, inject } from '@angular/core';
import { SettingsStore } from '../core/stores/settings.store';

@Component({
  selector: 'app-debug-settings',
  template: `
    <div style="background: #f0f0f0; padding: 12px; font-family: monospace; font-size: 11px; margin: 10px;">
      <div><strong>Status: {{ status() }}</strong></div>
      <div>Slug: {{ slug }}</div>
      <div>Settings Loaded: {{ !!settingsStore.settings() }}</div>
      <div>Store Name: {{ settingsStore.storeName() }}</div>
      <div>Primary Color: {{ settingsStore.settings()?.primaryColor || 'N/A' }}</div>
      <div>Theme ID: {{ settingsStore.themeId() }}</div>
      <pre>{{ settingsStore.settings() | json }}</pre>
    </div>
  `,
})
export class DebugSettingsComponent {
  settingsStore = inject(SettingsStore);
  slug = new URLSearchParams(window.location.search).get('tenant');
  status = signal('Loading...');

  ngOnInit() {
    if (this.settingsStore.settings()) {
      this.status.set('✅ Loaded');
    } else {
      this.status.set('❌ Not Loaded');
    }
  }
}
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "tenant-not-found" page shows
```
Root Cause: 
  - TenantService can't resolve slug from hostname/url

Fix:
  // Run in browser console:
  localStorage.setItem('MOBILYTICS_TENANT_OVERRIDE', 'demo')
  location.reload()

Verify:
  - TenantService.slug() should return "demo"
  - TenantService.resolved() should be true
```

### Issue 2: Settings not loading (blank store name)
```
Root Cause:
  - GET /Public/settings returns 404 or error
  - SettingsStore.loadSettings() not called
  - DEMO_SEED=true was not set

Fix:
  // Check endpoint
  curl http://localhost:5000/api/v1/Public/settings?tenant=demo
  
  // Reset backend
  Delete database
  Set DEMO_SEED=true
  dotnet run

Verify:
  - Check browser console for API errors
  - Check status code in Network tab
```

### Issue 3: Colors not applied (all default colors)
```
Root Cause:
  - CSS variables not set
  - applyTheme() not called
  - Settings have null color values

Fix:
  // Check current values
  getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
  
  // Manually set colors (temp)
  document.documentElement.style.setProperty('--color-primary', '#2563eb')
  
  // Log settings
  console.log(settingsStore.settings()?.primaryColor)

Verify:
  - primaryColor field is not null in DB
  - applyTheme() is called after loadSettings()
```

### Issue 4: Theme switcher not saving
```
Root Cause:
  - PUT /Settings endpoint not implemented
  - Missing X-Tenant-Slug header
  - 401 Unauthorized

Fix:
  // Check network request
  DevTools → Network → Look for PUT /Settings
  
  // Verify headers
  Should include:
    Authorization: Bearer <token>
    X-Tenant-Slug: demo
  
  // Check response status
  Should be 200 OK

Verify:
  - Backend has PUT /Settings endpoint
  - AuthService is authenticated
  - TenantService slug is resolved
```

---

## ✅ Final Verification Checklist

- [ ] Backend running with DEMO_SEED=true
- [ ] Database seeded with demo tenant
- [ ] Frontend running on http://localhost:4200
- [ ] Tenant override set: `localStorage.getItem('MOBILYTICS_TENANT_OVERRIDE')`
- [ ] Page title shows "TechHub Electronics | Mobilytics"
- [ ] Header shows "TechHub Electronics"
- [ ] Theme switcher visible in header
- [ ] Primary color is blue (#2563eb)
- [ ] 6 products visible on home page
- [ ] 5 categories in showcase
- [ ] 5 brands in carousel
- [ ] Network shows GET /Public/settings → 200
- [ ] Network shows GET /Public/sections → 200
- [ ] Network shows GET /Public/items → 200
- [ ] Console has no errors
- [ ] CSS variables are applied
- [ ] Theme switcher opens and closes
- [ ] Color picker changes colors in real-time
- [ ] "Save Theme" button saves to backend
- [ ] Refresh page and theme persists

---

**Everything verified!** ✅
