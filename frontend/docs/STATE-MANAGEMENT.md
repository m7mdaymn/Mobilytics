# State Management

## Approach

Mobilytics uses **Angular Signals** for all reactive state — no external state management library (NgRx, Akita, etc.). State is managed through:

1. **Signal-based Services** — Singleton services with `signal()` and `computed()` for global state
2. **Injectable Stores** — Dedicated store classes for domain-specific state
3. **Component-local Signals** — `signal()` within components for UI state

## Global State

### TenantService

Resolves the current tenant from the subdomain hostname.

```typescript
@Injectable({ providedIn: 'root' })
export class TenantService {
  readonly slug: Signal<string | null>;       // Current tenant slug
  readonly isValid: Signal<boolean>;          // Slug passes validation
  readonly isReserved: Signal<boolean>;       // Slug is reserved (www, api, admin, static)
  readonly resolved: Signal<boolean>;         // isValid && slug !== null

  resolve(): void;                            // Re-resolve from hostname
  setOverride(slug: string): void;            // Dev: set localStorage override
  clearOverride(): void;                      // Dev: clear override
}
```

**Data flow:**
```
hostname → extractFromHostname() → validate → set signals
  └─ Dev: localStorage / query param override
```

### AuthService

Manages JWT authentication and permission checking.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token: Signal<string | null>;                // JWT string
  readonly user: Signal<AuthUser | null>;               // Decoded user info
  readonly isAuthenticated: Signal<boolean>;             // token !== null

  login(request: LoginRequest): Observable<LoginResponse>;
  logout(): void;
  hasPermission(permission: PermissionKey): boolean;    // Owner always true
  hasAnyPermission(permissions: PermissionKey[]): boolean;
}
```

**JWT decode extracts:** `sub`, `email`, `name`, `role` (ASP.NET claim path), `permissions` (comma-separated), `tenantId`.

**Permission model:** 13 dot-separated keys. Owner role bypasses all checks.

```typescript
type PermissionKey =
  | 'items.create' | 'items.edit' | 'items.delete' | 'items.view'
  | 'invoices.create' | 'invoices.view' | 'invoices.refund'
  | 'expenses.manage' | 'employees.manage' | 'leads.manage'
  | 'settings.edit' | 'reports.view' | 'dashboard.view';
```

### ToastService

Notification queue with auto-dismiss.

```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts: Signal<Toast[]>;              // Current notifications

  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  remove(id: string): void;
}
```

Each toast auto-removes after ~5 seconds. The `ToastContainerComponent` renders the queue.

## Domain Stores

### SettingsStore

Loads tenant settings from the API and applies theme/branding globally.

```typescript
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  readonly settings: Signal<StoreSettings | null>;
  readonly loaded: Signal<boolean>;

  loadSettings(): Observable<StoreSettings | null>;
}
```

**On load:**
1. Fetches `GET /public/settings`
2. Sets `<body>` class to `theme-{themeId}`
3. Applies CSS custom properties for color overrides
4. Sets `<title>` and meta description
5. Creates dynamic PWA manifest blob URL

### CompareStore

Manages the product comparison list (max 2 items).

```typescript
@Injectable({ providedIn: 'root' })
export class CompareStore {
  readonly items: Signal<Item[]>;                // Current compare list
  readonly count: Signal<number>;                // items.length
  readonly isFull: Signal<boolean>;              // count >= 2
  readonly itemIds: Signal<Set<string>>;         // Quick lookup set

  isInCompare(itemId: string): boolean;
  toggle(item: Item): void;                      // Add or remove
  add(item: Item): boolean;                      // Returns false if full/duplicate
  remove(itemId: string): void;
  clear(): void;
}
```

## Component-Local State

Components use `signal()` for local UI state:

```typescript
// In a component
readonly loading = signal(false);
readonly items = signal<Item[]>([]);
readonly searchQuery = signal('');
readonly currentPage = signal(1);

// Computed values
readonly filteredItems = computed(() =>
  this.items().filter(i => i.title.includes(this.searchQuery()))
);
```

## State Flow Diagram

```
┌──────────────────────────────────────────────┐
│              Component Layer                 │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
│  │ signals │  │ computed  │  │ template   │  │
│  │ loading │→ │ filtered  │→ │ @for loop  │  │
│  │ items   │  │ Items     │  │ bindings   │  │
│  └────┬────┘  └──────────┘  └────────────┘  │
│       │                                      │
│  ┌────┴────────────────────────────────────┐ │
│  │         Service / Store Layer           │ │
│  │  TenantService.slug()                   │ │
│  │  AuthService.user()                     │ │
│  │  SettingsStore.settings()               │ │
│  │  CompareStore.items()                   │ │
│  │  ToastService.toasts()                  │ │
│  └────┬────────────────────────────────────┘ │
│       │                                      │
│  ┌────┴────────────────────────────────────┐ │
│  │          ApiService (HTTP)              │ │
│  │  GET/POST/PUT/DELETE → envelope unwrap  │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Best Practices

1. **Use `signal()` for mutable state** — prefer over BehaviorSubject
2. **Use `computed()` for derived values** — auto-tracks dependencies
3. **Use `asReadonly()` to expose signals** — prevent external mutation
4. **Keep stores focused** — one store per domain concept
5. **Avoid excessive nesting** — flatten signal reads in templates with `@let` or intermediate computeds
