// ── Mega Menu Navigation (from /Public/navigation) ──
export interface Navigation {
  itemTypes: NavItemType[];
  categories: NavCategory[];
  brands: NavBrand[];
  categoriesByType: Record<string, NavCategory[]>;
  featuredBrandsByType: Record<string, NavBrand[]>;
  flags: NavigationFlags;
}

export interface NavItemType {
  id: string;
  name: string;
  slug: string;
  isDevice: boolean;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children?: NavCategory[];
}

export interface NavBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface NavigationFlags {
  showLastPiece: boolean;
}
