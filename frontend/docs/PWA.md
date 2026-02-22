# Progressive Web App (PWA)

## Overview

Mobilytics is configured as a **Progressive Web App** using `@angular/service-worker`. PWA features are enabled only in production builds.

## Setup

PWA support was added via:

```bash
ng add @angular/pwa
```

This generated:
- `ngsw-config.json` — Service worker caching configuration
- `src/manifest.webmanifest` — Static PWA manifest (overridden dynamically)
- Updated `angular.json` with `"serviceWorker": true` in production config

## Service Worker Registration

In `src/app/app.config.ts`:

```typescript
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000',
})
```

The service worker registers after the app stabilizes (or after 30 seconds), only in production mode.

## Caching Strategy

Configured in `ngsw-config.json`:

### App Shell (Install)
- `index.html`, `*.css`, `*.js` — **prefetch** on install
- Ensures the app loads offline after first visit

### Assets (Lazy)
- Images, fonts, icons — **lazy** cache on first request
- Max age: 30 days, max size: 100 entries

### API Data (Network-first)
- Data requests use **freshness** strategy with network timeout
- Falls back to cached data when offline

## Dynamic Manifest

The `SettingsStore` generates a **dynamic PWA manifest** from tenant settings:

```typescript
// In SettingsStore.loadSettings()
const manifest = {
  name: settings.storeName,
  short_name: settings.storeName,
  theme_color: settings.pwa?.themeColor || '#2563eb',
  background_color: settings.pwa?.backgroundColor || '#ffffff',
  display: 'standalone',
  start_url: '/',
  icons: settings.pwa?.iconUrl
    ? [{ src: settings.pwa.iconUrl, sizes: '512x512', type: 'image/png' }]
    : [],
};

const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
const manifestUrl = URL.createObjectURL(blob);

// Update <link rel="manifest"> in document head
let link = document.querySelector('link[rel="manifest"]');
if (!link) {
  link = document.createElement('link');
  link.setAttribute('rel', 'manifest');
  document.head.appendChild(link);
}
link.setAttribute('href', manifestUrl);
```

This allows each tenant to have a unique app name, color, and icon when installed.

## Admin PWA Settings

In **Admin → Settings → PWA** tab:

| Setting | Purpose |
|---------|---------|
| Theme Color | Browser toolbar color (`theme_color`) |
| Background Color | Splash screen background (`background_color`) |
| App Icon URL | 512×512 PNG icon for install prompt |

## Installation

Users can install Mobilytics as a native-like app:

1. Visit the storefront in Chrome/Edge
2. Browser shows "Add to Home Screen" prompt
3. App launches in standalone mode (no browser chrome)

## Testing PWA

PWA features are **disabled in development** (`isDevMode()` check). To test:

```bash
# Build for production
npx ng build --configuration production

# Serve the dist folder with a static server
npx http-server dist/frontend -p 8080
```

Then visit `http://localhost:8080` — service worker will register and caching will work.

## Offline Support

After first visit in production:
- App shell loads from cache (instant)
- Previously viewed items/pages load from cache
- New data requests fail gracefully with cached fallback
- Toast notification informs user of offline state
