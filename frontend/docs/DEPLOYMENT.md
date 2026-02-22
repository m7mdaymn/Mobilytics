# Deployment Guide

## Build for Production

```bash
cd frontend
npx ng build --configuration production
```

**Output**: `dist/frontend/` containing:
- `index.html` — Entry point
- `*.js` — Hashed JavaScript bundles
- `*.css` — Compiled Tailwind styles
- `ngsw-worker.js` — Service worker
- `manifest.webmanifest` — Static PWA manifest (overridden dynamically)
- `assets/` — Static assets and icons

**Bundle size**: ~359 kB initial (well under 500 kB budget).

## Hosting Requirements

Since this is a **single-page application**, the web server must:
1. Serve `index.html` for all routes (SPA fallback)
2. Serve static files from `dist/frontend/`
3. Support HTTPS (required for service worker)
4. Enable gzip/brotli compression

## Deployment Options

### Vercel (Primary)

The frontend is deployed to Vercel at `mobilytics.vercel.app`.

**Setup**:
1. Connect the Git repository to Vercel
2. Set the **Root Directory** to `frontend`
3. Framework Preset: **Other** (Angular handles its own build)
4. Build Command: `npx ng build --configuration production`
5. Output Directory: `dist/frontend`

**SPA Routing** is handled by `vercel.json` in the `frontend/` directory:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Multi-Tenancy on Vercel**:
- Until wildcard subdomains are configured (`{slug}.mobilytics.com`), use the query parameter fallback:
  ```
  https://mobilytics.vercel.app?tenant=my-store
  ```
- The `TenantService` automatically detects Vercel as a fallback domain and checks `?tenant=` query param → localStorage → defaults to empty.
- Once a `?tenant=slug` is visited, the slug is persisted in `localStorage` for subsequent visits.

**Testing tenant override locally**:
```bash
# Start dev server
npx ng serve

# Open with tenant override
http://localhost:4200?tenant=my-store
```

### Azure Static Web Apps

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm ci && npx ng build --configuration production
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_SWA_TOKEN }}
          app_location: frontend/dist/frontend
          skip_api_build: true
```

Configure `staticwebapp.config.json`:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["*.{css,js,png,jpg,svg,ico,woff2}"]
  },
  "globalHeaders": {
    "Cache-Control": "public, max-age=31536000, immutable"
  },
  "routes": [
    {
      "route": "/index.html",
      "headers": { "Cache-Control": "no-cache" }
    }
  ]
}
```

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name *.mobilytics.com;

    root /var/www/mobilytics/frontend;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache hashed assets aggressively
    location ~* \.[0-9a-f]{16}\.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

### Docker

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npx ng build --configuration production

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## DNS & Multi-Tenancy

### Wildcard DNS

Set up a wildcard DNS record:
```
*.mobilytics.com → A record → server IP
```

The frontend extracts the subdomain (e.g., `my-store.mobilytics.com` → slug `my-store`) and sends it as the `X-Tenant-Slug` header on every API request.

### SSL

Use a wildcard SSL certificate for `*.mobilytics.com`:
- **Let's Encrypt**: Use DNS-01 challenge for wildcard certs
- **Azure**: Managed certificates with App Service

## Environment Configuration

For different environments, update `src/environments/`:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://mobilytics.runasp.net',
  appDomain: 'mobilytics.com',
};
```

## CI/CD Pipeline

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm ci
      - run: cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
      - run: cd frontend && npx ng build --configuration production
```

## Post-Deployment Checklist

- [ ] Verify wildcard DNS resolves correctly
- [ ] Confirm HTTPS / SSL certificate active
- [ ] Test SPA fallback (deep links work: `/catalog`, `/admin`)
- [ ] Verify API connectivity (`X-Tenant-Slug` header sent)
- [ ] Test PWA install on mobile device
- [ ] Confirm service worker caching (offline works after first load)
- [ ] Check bundle size in network tab (< 500 kB initial)
- [ ] Verify theme application (CSS variables load from API)
- [ ] Test admin login and CRUD operations
- [ ] Run Lighthouse audit (target: 90+ Performance, 100 PWA)
