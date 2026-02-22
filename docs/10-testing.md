# Nova Node — Testing

## Test Summary

| Suite | Framework | Tests | Status |
|-------|-----------|-------|--------|
| Unit Tests | xUnit + Moq | 39 | ✅ All passing |
| Integration Tests | xUnit + WebApplicationFactory | 11 | ✅ All passing |
| **Total** | | **50** | ✅ |

## Running Tests

```bash
# All tests
dotnet test

# Unit tests only
dotnet test tests/NovaNode.Tests.Unit

# Integration tests only
dotnet test tests/NovaNode.Tests.Integration

# With verbose output
dotnet test --verbosity normal

# Run a specific test
dotnet test --filter "PlatformLogin_ShouldReturnToken"
```

## Unit Tests

Located at `tests/NovaNode.Tests.Unit/`.

### Architecture
- Use **Moq** for mocking `AppDbContext` and service dependencies
- Use `MockDbSet<T>` helper for in-memory queryable DbSets
- No database or HTTP server involved
- Fast execution (~3 seconds)

### Test Classes

| Class | Tests | Covers |
|-------|-------|--------|
| BrandServiceTests | 5 | CRUD operations for brands |
| CategoryServiceTests | 4 | CRUD + tree hierarchy |
| ItemServiceTests | 6 | CRUD + status management + image handling |
| InvoiceServiceTests | 5 | Create, refund, filter, stock updates |
| LeadServiceTests | 4 | CRUD + status update + export |
| EmployeeServiceTests | 5 | CRUD + permissions + salary generation |
| ExpenseServiceTests | 4 | CRUD + category management |
| PlatformServiceTests | 6 | Dashboard, tenants, plans, subscriptions |

## Integration Tests

Located at `tests/NovaNode.Tests.Integration/`.

### Architecture
- Use `WebApplicationFactory<Program>` via `CustomWebApplicationFactory`
- **InMemory database** (no SQL Server needed)
- Full HTTP pipeline tested (middleware, auth, serialization)
- Environment set to `"Testing"` to skip SQL Server registration

### CustomWebApplicationFactory

The factory:
1. Sets environment to `"Testing"` (Program.cs skips SQL Server DbContext registration)
2. Registers `AppDbContext` with `UseInMemoryDatabase`
3. Each test class gets a unique database name via `Guid.NewGuid()`
4. `DatabaseSeeder` runs automatically, creating the SuperAdmin user and default plan

### Test Classes

| Class | Tests | Covers |
|-------|-------|--------|
| PlatformEndpointTests | 6 | Platform login, dashboard, tenants, plans |
| TenantFlowTests | 5 | Tenant creation, login, brands CRUD, auth errors |

### Platform Endpoint Tests

| Test | Validates |
|------|-----------|
| `PlatformLogin_ShouldReturnToken` | SuperAdmin login returns valid JWT |
| `PlatformLogin_InvalidCredentials_ShouldReturn401` | Wrong password returns 401 |
| `GetDashboard_ShouldReturnCounts` | Dashboard endpoint returns metrics |
| `CreateTenant_ShouldSucceed` | Full tenant creation flow |
| `GetPlans_ShouldReturnAtLeastOne` | Seeded "Standard" plan is returned |
| `Unauthorized_GetDashboard_ShouldReturn401` | Dashboard without token returns 401 |

### Tenant Flow Tests

| Test | Validates |
|------|-----------|
| `TenantLogin_ShouldSucceed` | Create tenant → login as owner |
| `TenantLogin_WrongPassword_ShouldReturn401` | Wrong password returns 401 |
| `BrandsCrud_ShouldWork` | Full CRUD cycle: create, list, get, update, delete |
| `Unauthenticated_BrandsGet_ShouldReturn401` | No auth token returns 401 |
| `MissingTenantSlug_ShouldReturn400` | No tenant slug returns 400 |

### Response Envelope

Integration tests account for the `ApiResponse<T>` envelope wrapper:

```csharp
var envelope = JsonSerializer.Deserialize<ApiResponse<PlatformLoginResponse>>(body, JsonOpts);
var token = envelope!.Data!.Token;
```

All endpoint responses are wrapped in:
```json
{
  "success": true,
  "data": { /* actual response */ },
  "message": null,
  "errors": null
}
```
