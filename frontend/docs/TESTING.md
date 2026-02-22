# Testing Strategy

## Framework

| Tool | Purpose |
|------|---------|
| Jasmine | Test framework (assertions, spies, suites) |
| Karma | Test runner |
| ChromeHeadless | Browser for headless CI testing |
| Angular TestBed | Component & service test harness |
| HttpTestingController | HTTP request mocking |

## Running Tests

```bash
# All tests, headless (CI-friendly)
npx ng test --watch=false --browsers=ChromeHeadless

# Interactive watch mode
npx ng test

# Single file
npx ng test --include='**/auth.service.spec.ts'
```

## Test Summary

**64 tests across 15 spec files** — all passing.

### Service Tests

| Spec File | Tests | Coverage |
|-----------|-------|----------|
| `tenant.service.spec.ts` | 8 | Signal API, setOverride, clearOverride |
| `api.service.spec.ts` | 7 | GET/POST/PUT/DELETE, params, upload, envelope unwrap |
| `auth.service.spec.ts` | 5 | Login, logout, JWT decode, permission checks, Owner bypass |
| `toast.service.spec.ts` | 6 | Add/remove, all 4 types, multiple toasts, signal state |

### Store Tests

| Spec File | Tests | Coverage |
|-----------|-------|----------|
| `compare.store.spec.ts` | 7 | Add/remove/toggle/clear, max 2 limit, itemIds computed |

### Guard Tests

| Spec File | Tests | Coverage |
|-----------|-------|----------|
| `auth.guard.spec.ts` | 2 | Block unauthenticated, redirect to /admin/login |

### Interceptor Tests

| Spec File | Tests | Coverage |
|-----------|-------|----------|
| `api.interceptor.spec.ts` | 3 | X-Tenant-Slug header (present/absent), request passthrough |

### Component Tests

| Spec File | Tests | Coverage |
|-----------|-------|----------|
| `app.component.spec.ts` | 1 | Component creation |
| `toast-container.component.spec.ts` | 3 | Creation, empty state, toast rendering |
| `pagination.component.spec.ts` | 5 | Page info, emit change, bounds checking |
| `item-card.component.spec.ts` | 4 | Creation, title, price, condition badge |
| `login.component.spec.ts` | 4 | Creation, form fields, button, validation |
| `inactive.component.spec.ts` | 2 | Creation, message display |
| `tenant-not-found.component.spec.ts` | 2 | Creation, message display |
| `blocked.component.spec.ts` | 2 | Creation, message display |

## Test Patterns

### Service Test Pattern

```typescript
describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch data', () => {
    service.getData().subscribe(data => {
      expect(data.length).toBe(2);
    });
    const req = httpMock.expectOne('/api/v1/data');
    req.flush({ success: true, data: [{}, {}], message: '' });
  });
});
```

### Component Test Pattern

```typescript
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should render', () => {
    component.someInput = mockData;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Expected text');
  });
});
```

### Guard Test Pattern

```typescript
describe('authGuard', () => {
  it('should redirect when unauthenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeInstanceOf(UrlTree);
  });
});
```

## Adding New Tests

1. Create `*.spec.ts` adjacent to the source file
2. Follow the patterns above
3. Run `npx ng test --watch=false --browsers=ChromeHeadless` to verify
4. All tests must pass before merging
