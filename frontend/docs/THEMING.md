# Theming System

## Overview

Mobilytics supports **3 selectable themes** applied via CSS custom properties. Each tenant can choose a theme in Admin → Settings → Theme tab. The `SettingsStore` applies the selected theme on application startup.

## Theme Definitions

### Theme 1 — Ocean Blue (Default)
```css
--color-primary: #2563eb;
--color-secondary: #1e40af;
--color-accent: #f59e0b;
--color-bg: #ffffff;
--color-bg-alt: #f8fafc;
--color-text: #1e293b;
--color-text-muted: #64748b;
--color-border: #e2e8f0;
```

### Theme 2 — Forest Green
```css
--color-primary: #059669;
--color-secondary: #047857;
--color-accent: #f97316;
--color-bg: #ffffff;
--color-bg-alt: #f0fdf4;
--color-text: #1a2e1a;
--color-text-muted: #4d7c4d;
--color-border: #d1e7d1;
```

### Theme 3 — Royal Purple
```css
--color-primary: #7c3aed;
--color-secondary: #6d28d9;
--color-accent: #ec4899;
--color-bg: #ffffff;
--color-bg-alt: #faf5ff;
--color-text: #2e1065;
--color-text-muted: #7c6c9f;
--color-border: #e0d4f5;
```

## How Themes Work

### 1. CSS Custom Properties (`src/styles.css`)

The global stylesheet defines theme wrappers (`.theme-1`, `.theme-2`, `.theme-3`) that set CSS custom properties on `<body>`:

```css
.theme-1 {
  --color-primary: #2563eb;
  /* ... */
}
```

### 2. Settings Store Application

When the app loads, `SettingsStore.loadSettings()`:
1. Fetches `StoreSettings` from `GET /public/settings`
2. Applies the theme class to `<body>`:
   ```typescript
   document.body.className = `theme-${settings.themeId || 1}`;
   ```
3. Overrides colors if custom values exist in `settings.theme`:
   ```typescript
   if (settings.theme?.primaryColor) {
     document.body.style.setProperty('--color-primary', settings.theme.primaryColor);
   }
   ```

### 3. Component Consumption

All components reference CSS variables, never hard-coded colors:

```html
<button class="bg-[color:var(--color-primary)] text-white">Buy</button>
<p class="text-[color:var(--color-text-muted)]">Description</p>
```

### 4. Utility Classes (`src/styles.css`)

Pre-built utility classes that use theme variables:

| Class | Purpose |
|-------|---------|
| `.btn-primary` | Primary action button |
| `.btn-secondary` | Secondary action button |
| `.btn-accent` | Accent/highlight button |
| `.btn-outline` | Outlined button |
| `.btn-danger` | Destructive action button |
| `.btn-whatsapp` | WhatsApp green CTA button |
| `.card` | Card container with border & shadow |
| `.badge-*` | Status badges (new, used, refurbished, etc.) |
| `.input-field` | Form input styling |
| `.input-error` | Error state for inputs |
| `.skeleton` | Loading placeholder animation |

## Admin Theme Editor

The **Settings → Theme** tab in the admin dashboard allows:

- Selecting Theme 1, 2, or 3
- Custom color overrides for primary, secondary, accent colors via color pickers
- Preview updates in real-time (CSS variables are changed immediately)

## Adding a New Theme

1. Add a new `.theme-N` block to `src/styles.css` with all required CSS variables
2. Add the option to the admin settings theme selector
3. No component changes needed — all components consume CSS variables
