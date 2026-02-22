# Nova Node — Dependency Injection

## Service Registration

All services are registered in the DI container at startup via extension methods.

### Registration Methods

| Method | Location | Registers |
|--------|----------|-----------|
| `AddApplication()` | NovaNode.Application | FluentValidation validators |
| `AddInfrastructure(connStr)` | NovaNode.Infrastructure | DbContext + all services |
| `AddInfrastructureServices()` | NovaNode.Infrastructure | Services only (for testing) |

### Program.cs Registration Flow

```csharp
builder.Services.AddApplication();

if (builder.Environment.EnvironmentName == "Testing")
    builder.Services.AddInfrastructureServices();  // No DbContext
else
    builder.Services.AddInfrastructure(connectionString);  // Full setup
```

## Service Lifetimes

All infrastructure services are registered as **Scoped** (one instance per HTTP request):

| Interface | Implementation | Lifetime |
|-----------|---------------|----------|
| `ITenantContext` | `TenantContext` | Scoped |
| `IFileStorage` | `LocalFileStorage` | Scoped |
| `IAuditService` | `AuditService` | Scoped |
| `IAuthService` | `AuthService` | Scoped |
| `IBrandService` | `BrandService` | Scoped |
| `ICategoryService` | `CategoryService` | Scoped |
| `IItemTypeService` | `ItemTypeService` | Scoped |
| `ICustomFieldService` | `CustomFieldService` | Scoped |
| `IItemService` | `ItemService` | Scoped |
| `IHomeSectionService` | `HomeSectionService` | Scoped |
| `ILeadService` | `LeadService` | Scoped |
| `IInvoiceService` | `InvoiceService` | Scoped |
| `IExpenseService` | `ExpenseService` | Scoped |
| `IEmployeeService` | `EmployeeService` | Scoped |
| `IStoreSettingsService` | `StoreSettingsService` | Scoped |
| `IReportService` | `ReportService` | Scoped |
| `IPlatformService` | `PlatformService` | Scoped |

## Framework Services

| Service | Registration | Notes |
|---------|-------------|-------|
| `AppDbContext` | `AddDbContext` | SQL Server with connection string |
| `JwtBearer` | `AddAuthentication` | HS256, validated issuer/audience/lifetime |
| `Authorization` | `AddAuthorization` | Role-based policies |
| `ApiVersioning` | `AddApiVersioning` | Default v1.0, URL segment versioning |
| `Swagger` | `AddSwaggerGen` | Custom JWT security scheme |
| `CORS` | `AddCors` | Allow any origin/method/header |
| `Serilog` | `UseSerilog` | Console + file sinks |

## Interface Locations

| Layer | Interface Path |
|-------|---------------|
| Domain | `src/NovaNode.Domain/Interfaces/` |
| Application | `src/NovaNode.Application/Interfaces/` |

### Domain Interfaces
- `ITenantContext` — Provides current tenant ID and slug

### Application Interfaces
- `IAuthService`, `IBrandService`, `ICategoryService`, etc.
- `IFileStorage`, `IAuditService`
- All service interfaces defining the business operations contract
