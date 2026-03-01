// ─── DEPRECATED ───────────────────────────────────────────────
// HomeSections feature removed. Home page now uses a fixed premium layout
// driven by existing API endpoints (items, brands, categories, best-sellers)
// and new Settings fields (heroBannersJson, testimonialsJson).
// This component is kept as a stub for import safety.
// ──────────────────────────────────────────────────────────────

import { Component } from '@angular/core';

@Component({
  selector: 'app-home-sections',
  standalone: true,
  template: `<div class="text-center text-gray-400 py-12">This feature has been deprecated.</div>`,
})
export class HomeSectionsComponent {}
