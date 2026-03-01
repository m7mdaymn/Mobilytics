import { Injectable, signal } from '@angular/core';
import { NavBrand, NavCategory, Navigation } from '../models/navigation.models';

@Injectable({ providedIn: 'root' })
export class StoreNavService {
  /** Flat list of all categories (so we can map slug → id) */
  private allCategories: NavCategory[] = [];
  /** Category id → NavBrand[] */
  private brandsByCategory: Record<string, NavBrand[]> = {};

  readonly navigationLoaded = signal(false);

  /** Called by StorefrontShellComponent once navigation data arrives */
  setNavigation(nav: Navigation): void {
    this.allCategories = nav.categories || [];
    this.brandsByCategory = nav.brandsByCategory || {};
    this.navigationLoaded.set(true);
  }

  /** Returns brands for a category identified by its slug */
  getBrandsByCategorySlug(slug: string): NavBrand[] {
    const cat = this.allCategories.find(c => c.slug === slug);
    if (!cat) return [];
    return this.brandsByCategory[cat.id] || [];
  }
}
