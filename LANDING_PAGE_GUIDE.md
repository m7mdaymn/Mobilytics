# 🚀 Vercel Deployment & Landing Page Setup

## ✅ What's New

Your Mobilytics app now has a **landing page** for the root domain `https://mobilytics.vercel.app/` that allows users to:
- Browse all available stores
- Quick-visit the demo store
- Select any store to shop

## 📝 How It Works

### Route Structure

```
https://mobilytics.vercel.app/            → Landing Page (store selector)
https://mobilytics.vercel.app/landing     → Same landing page
https://mobilytics.vercel.app/?tenant=demo → Auto-load demo store
```

When you visit the root domain or `/landing`, the app shows the **Landing Page** where users can:
1. **Click "Visit Demo Store"** → Automatically loads the demo store
2. **Browse All Stores** → Lists available tenants from your backend
3. **Select a Store** → Loads that store's products & settings

### Multi-Store Access on Vercel

Since you're using `https://mobilytics.vercel.app/` (single domain), stores are accessed via **localStorage + query parameters**:

```
# Visit demo store with auto-load
https://mobilytics.vercel.app/?tenant=demo

# The landing page detects this, stores it in localStorage,
# and redirects to the store
```

**For users visiting the root domain:**
- They see the landing page with all stores
- They click on a store
- The app sets `localStorage.MOBILYTICS_TENANT_OVERRIDE = "store-slug"`
- Routes to `/` to load the selected store
- All subsequent navigations remember the selected store

---

## 🔧 Guard Behavior

### `tenantResolverGuard`

This new guard ensures:
- ✅ If tenant is resolved → Allow access to storefront
- ❌ If no tenant → Redirect to `/landing`
- ❌ If reserved subdomain (www, api, admin) → Redirect to `/landing`

**Routes Protected:**
- `/` (home)
- `/catalog`
- `/category/:slug`
- `/brands`
- `/item/:slug`
- And all other storefront routes

**Routes NOT Protected:**
- `/landing` (public access)
- `/superadmin/*` (platform admin)
- `/admin/login` (tenant admin login)

---

## 🎯 User Flow

### First-Time Visitor

```
User visits: https://mobilytics.vercel.app/
     ↓
Guard checks: Is tenant resolved?
     ↓
NO → Redirect to /landing
     ↓
Landing Page shows:
  - "🚀 Visit Demo Store" button
  - "Browse All Stores" button
  - Grid of available stores
     ↓
User clicks a store
     ↓
App sets: localStorage.MOBILYTICS_TENANT_OVERRIDE = "store-slug"
     ↓
Navigate to: https://mobilytics.vercel.app/
     ↓
Guard checks: Is tenant resolved?
     ↓
YES → Allow access to storefront
     ↓
Home page loads with store's products, colors, branding
```

### Returning Visitor

```
User visits: https://mobilytics.vercel.app/
     ↓
Guard checks localStorage for stored tenant
     ↓
YES → Allow access
     ↓
Store loaded with products & branding
```

---

## 📱 Available Endpoints

### Public API

The landing page tries to fetch from:
```
GET /api/tenants/public
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "abc123",
      "slug": "demo",
      "name": "Demo Store",
      "description": "Explore our premium electronics and accessories"
    },
    {
      "id": "def456",
      "slug": "store1",
      "name": "Store 1",
      "description": "..."
    }
  ]
}
```

**Fallback:** If API fails, shows hardcoded demo store.

---

## 🔌 Backend Integration (Next Step)

You'll need to implement the public tenants endpoint on your backend:

### ASP.NET Core Controller

```csharp
[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TenantsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicTenants()
    {
        var tenants = await _mediator.Send(new GetPublicTenantsQuery());
        return Ok(new { data = tenants });
    }
}
```

### Handler

```csharp
public class GetPublicTenantsQueryHandler : IRequestHandler<GetPublicTenantsQuery, List<TenantDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPublicTenantsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TenantDto>> Handle(GetPublicTenantsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Tenants
            .Where(t => t.IsActive)  // Only show active tenants
            .Select(t => new TenantDto
            {
                Id = t.Id.ToString(),
                Slug = t.Slug,
                Name = t.Name,
                Description = t.Description
            })
            .ToListAsync(cancellationToken);
    }
}
```

---

## 🌐 Accessing Stores Post-Deployment

### Current Setup (Vercel - Single Domain)

**URL Pattern:**
```
https://mobilytics.vercel.app/?tenant=STORE_SLUG
```

**Examples:**
```
https://mobilytics.vercel.app/?tenant=demo        → Demo store
https://mobilytics.vercel.app/?tenant=store1      → Store 1
https://mobilytics.vercel.app/?tenant=store2      → Store 2
```

### Custom Domain with Subdomains (Future)

If you buy a custom domain (e.g., `mobilytics.com`), you can set up:

```
demo.mobilytics.com                    → Auto-detects "demo" tenant
store1.mobilytics.com                  → Auto-detects "store1" tenant
www.mobilytics.com  or mobilytics.com  → Landing page
```

**DNS Records:** (Example for GoDaddy/Namecheap)
```
demo          CNAME  cname.vercel.sh
store1        CNAME  cname.vercel.sh
*.            CNAME  cname.vercel.sh
```

The TenantService already supports this - just set up the DNS records!

---

## 🧪 Test Landing Page Locally

```bash
# Terminal 1: Run backend
cd src/NovaNode.Api
dotnet run

# Terminal 2: Run frontend
cd frontend
ng serve

# Visit
http://localhost:4200/landing
```

**What you should see:**
- ✅ Header with Mobilytics logo
- ✅ "Visit Demo Store" button
- ✅ "Browse All Stores" button
- ✅ 3 info cards (Browse Stores, Quality Products, Secure & Fast)
- ✅ Stores grid (should show demo store + any from API)
- ✅ "How It Works" section with 4 steps
- ✅ Footer

---

## 🚨 Troubleshooting

### Issue: Stores Not Loading in Grid

**Solution:**
1. Check browser console for API errors
2. Verify backend `/api/tenants/public` endpoint exists
3. Check CORS configuration on backend
4. Check that `FALLBACK_DOMAINS` includes your Vercel domain in `tenant.service.ts`

```typescript
// In tenant.service.ts
const FALLBACK_DOMAINS = [
  'mobilytics.vercel.app',  // ← Your domain
  'localhost',
];
```

### Issue: Query Param Not Working (`?tenant=demo`)

**Solution:**
1. Verify tenant slug exists in database
2. Check localStorage (open DevTools → Application → Local Storage)
3. Clear localStorage: `localStorage.clear()` in console
4. Refresh page

### Issue: Landing Page Shows But Store Selection Not Working

**Solution:**
1. Check that `TenantService.setOverride()` is being called
2. Verify localStorage is not disabled
3. Check browser console for JavaScript errors
4. Ensure guard is properly imported in app.routes.ts

---

## 📊 File Structure

```
frontend/src/app/
├── public/
│   ├── pages/
│   │   ├── landing/
│   │   │   └── landing.component.ts          ← NEW: Landing page
│   │   ├── home/
│   │   │   └── home.component.ts
│   │   └── ...other pages
│   └── layouts/
│       └── storefront-shell.component.ts
├── core/
│   ├── guards/
│   │   ├── tenant-resolver.guard.ts          ← NEW: Guard for tenant check
│   │   ├── auth.guard.ts
│   │   └── platform-auth.guard.ts
│   └── services/
│       └── tenant.service.ts                 ← Updated with fallback domains
└── app.routes.ts                             ← Updated with landing route & guard
```

---

## ✨ Next Steps

### 1. **Implement Backend Endpoint** (Required)
Implement `/api/tenants/public` on your backend to return list of active tenants.

### 2. **Deploy to Vercel** (Ready!)
```bash
git push origin main
# Vercel auto-deploys
```

### 3. **Test Flow**
1. Visit `https://mobilytics.vercel.app/`
2. Should see landing page
3. Click "Visit Demo Store"
4. Should load demo store home page
5. Test navigation (catalog, brands, item detail)

### 4. **Add More Tenants** (Optional)
In your platform super admin (`/superadmin/tenants`), create more tenants:
- They'll automatically appear in the landing page store grid
- Users can click to visit them

### 5. **Custom Domain** (Future Upgrade)
When ready to go live:
1. Buy custom domain
2. Set up wildcard DNS records
3. Update `FALLBACK_DOMAINS` in `tenant.service.ts`
4. TenantService automatically extracts subdomain

---

## 🎉 You're All Set!

Your Mobilytics platform is now:
- ✅ Deployed on Vercel
- ✅ Landing page for root domain
- ✅ Multi-store support
- ✅ localStorage-based store selection
- ✅ Ready for custom subdomains

**Push your changes and test!**

```bash
git add .
git commit -m "feat: Add landing page and tenant resolver guard for Vercel deployment"
git push origin main
```

---

## 📖 Related Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete Vercel setup
- [GIT_QUICK_REFERENCE.md](./GIT_QUICK_REFERENCE.md) - Git commands
- [SEEDED_DATA_GUIDE.md](./SEEDED_DATA_GUIDE.md) - Demo data
- docs/05-multi-tenancy.md - Architecture details
