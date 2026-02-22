# Getting Started

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x+ | Runtime |
| npm | 10.x+ | Package manager |
| Angular CLI | 19.x | Build & dev tooling |
| Chrome | Latest | Headless testing |

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd Mobilytics/frontend

# Install dependencies
npm install
```

## Development Server

```bash
npx ng serve
```

Open `http://localhost:4200`. The app auto-reloads on file changes.

### Tenant Resolution in Dev

On `localhost`, the subdomain cannot be detected. Use one of these methods:

**Query parameter** (temporary, current session only):
```
http://localhost:4200?tenant=my-store
```

**localStorage override** (persists across sessions):
```js
localStorage.setItem('MOBILYTICS_TENANT_OVERRIDE', 'my-store');
```

**Clear override**:
```js
localStorage.removeItem('MOBILYTICS_TENANT_OVERRIDE');
```

Or use `TenantService.setOverride('my-store')` / `clearOverride()` from the browser console.

## Build

```bash
# Development build
npx ng build

# Production build
npx ng build --configuration production
```

Output is generated in `dist/frontend/`. The production build includes:
- Tree shaking, minification, and AOT compilation
- Service worker for PWA
- Bundle budgets: 500 kB warning / 1 MB error (initial)

## Running Tests

```bash
# Run all tests (headless)
npx ng test --watch=false --browsers=ChromeHeadless

# Run in watch mode (interactive)
npx ng test

# Run specific test file
npx ng test --include='**/auth.service.spec.ts'
```

Current test count: **64 tests across 15 spec files**.

## Code Scaffolding

All components are **standalone** (no modules). To generate a new component:

```bash
npx ng generate component feature/pages/my-page --standalone
```

## Project Configuration

| File | Purpose |
|------|---------|
| `angular.json` | Angular CLI workspace config, budgets, PWA |
| `tsconfig.json` | TypeScript strict mode configuration |
| `.postcssrc.json` | PostCSS + TailwindCSS v4 plugin |
| `src/environments/` | API base URL, app domain per environment |
| `ngsw-config.json` | Service worker caching strategies |

## Environment Variables

Edit `src/environments/environment.ts` (dev) or `environment.prod.ts` (prod):

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.mobilytics.com',
  appDomain: 'mobilytics.com',
};
```

## Backend API

The frontend communicates with the **Nova Node API** (ASP.NET Core .NET 9) at:
```
https://api.mobilytics.com/api/v1
```

All API responses follow the envelope format:
```json
{
  "success": true,
  "data": { ... },
  "message": "",
  "errors": null
}
```

The `ApiService` automatically unwraps this envelope, so consumers receive only the `data` payload.
