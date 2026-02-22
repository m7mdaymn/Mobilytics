# Mobilytics — Phone Store SaaS Frontend

Mobilytics is a **multi-tenant Phone Store SaaS** built with **Angular 19**, designed for mobile phone retailers across the Middle East and North Africa. Each tenant gets a branded online storefront and admin dashboard under a subdomain (`slug.mobilytics.com`).

## Key Features

- **Public Storefront** — Dynamic homepage, full catalog with filters, brand/category browsing, item detail with specs, side-by-side comparison (max 2), WhatsApp-centric selling
- **Admin Dashboard** — KPI dashboard, full CRUD for items/brands/categories/item-types, invoice management with refunds, expense tracking with salary generation, employee management with granular permissions, lead tracking with WhatsApp follow-up, store settings with theme editor
- **Multi-Tenancy** — Subdomain-based tenant resolution via `X-Tenant-Slug` HTTP header
- **PWA** — Service worker for offline support, dynamic manifest from store settings
- **3 Themes** — Selectable color schemes applied via CSS custom properties
- **WhatsApp Integration** — Click-to-chat on items, follow-up messages for leads

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 19.2.20 (standalone components, signals) |
| Styling | TailwindCSS v4 + CSS custom properties |
| State | Angular Signals + Injectable stores |
| Routing | Lazy-loaded routes with functional guards |
| HTTP | Functional interceptors, envelope unwrapping |
| PWA | @angular/service-worker |
| Testing | Jasmine + Karma (ChromeHeadless) |
| Backend | ASP.NET Core .NET 9 (Nova Node API) |

## Quick Start

```bash
cd frontend
npm install
npx ng serve          # Dev server at http://localhost:4200
npx ng test           # Run 64 unit tests
npx ng build          # Production build → dist/frontend/
```

Add `?tenant=your-slug` or set `MOBILYTICS_TENANT_OVERRIDE` in localStorage for local development.

## Project Structure

```
src/app/
├── core/          # Services, models, guards, interceptors, stores
├── shared/        # Reusable components (item-card, pagination, toast, etc.)
├── public/        # Public storefront pages and layouts
├── admin/         # Admin dashboard pages and layout
├── app.routes.ts  # Route definitions
├── app.config.ts  # App providers
└── app.component.ts
```

## Documentation

| Document | Description |
|----------|------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture overview |
| [GETTING-STARTED.md](GETTING-STARTED.md) | Setup and development guide |
| [API-INTEGRATION.md](API-INTEGRATION.md) | Backend API endpoint mapping |
| [THEMING.md](THEMING.md) | Theme system and custom properties |
| [ROUTING.md](ROUTING.md) | Route map and guard configuration |
| [STATE-MANAGEMENT.md](STATE-MANAGEMENT.md) | Signals and injectable stores |
| [PWA.md](PWA.md) | Progressive Web App setup |
| [TESTING.md](TESTING.md) | Test strategy and coverage |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment guide |

## License

Proprietary — Mobilytics © 2025
