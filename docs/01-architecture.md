# Nova Node — Architecture Overview

## Clean Architecture

Nova Node follows **Clean Architecture** (also known as Onion Architecture) with four layers:

```
┌──────────────────────────────────────┐
│            NovaNode.Api              │  ← HTTP layer (Controllers, Middleware)
├──────────────────────────────────────┤
│        NovaNode.Infrastructure       │  ← Data access, Auth, External services
├──────────────────────────────────────┤
│        NovaNode.Application          │  ← DTOs, Interfaces, Validators
├──────────────────────────────────────┤
│          NovaNode.Domain             │  ← Entities, Enums, Value Objects
└──────────────────────────────────────┘
```

### Dependency Direction

Dependencies flow **inward only**:

- **Domain** → no dependencies (pure C# library)
- **Application** → depends on Domain
- **Infrastructure** → depends on Domain + Application
- **Api** → depends on Infrastructure (transitively Domain + Application)

### Project Structure

```
src/
├── NovaNode.Api/               # ASP.NET Core Web API
│   ├── Controllers/            # API endpoints
│   │   └── Platform/           # SuperAdmin endpoints
│   ├── Middleware/              # Custom middleware
│   └── Program.cs              # Application entry point
│
├── NovaNode.Application/       # Business contracts
│   ├── DTOs/                   # Request/Response models
│   ├── Interfaces/             # Service interfaces
│   └── Validators/             # FluentValidation rules
│
├── NovaNode.Domain/            # Core domain
│   ├── Entities/               # EF Core entities
│   ├── Enums/                  # Domain enumerations
│   └── Interfaces/             # Domain contracts
│
└── NovaNode.Infrastructure/    # Implementation
    ├── Persistence/            # EF Core DbContext, Configs
    ├── Services/               # Service implementations
    ├── Seeding/                # Database seeder
    └── Migrations/             # EF Core migrations

tests/
├── NovaNode.Tests.Unit/        # 39 unit tests (xUnit + Moq)
└── NovaNode.Tests.Integration/ # 11 integration tests (WebApplicationFactory)
```

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | .NET | 9.0 |
| Web Framework | ASP.NET Core | 9.0 |
| ORM | Entity Framework Core | 9.0.7 |
| Database | SQL Server | — |
| Authentication | JWT Bearer (HS256) | — |
| Validation | FluentValidation | 12.1.1 |
| Password Hashing | BCrypt.Net-Next | 4.1.0 |
| Logging | Serilog | 10.0.0 |
| API Docs | Swashbuckle (Swagger) | 7.2.0 |
| API Versioning | Asp.Versioning.Mvc | 8.1.1 |
| Testing | xUnit + Moq | — |

## Multi-Tenancy Model

Nova Node uses a **single-database, shared-schema** multi-tenancy model:

- Every tenant-scoped entity inherits from `TenantEntity` which includes a `TenantId` column
- The `AppDbContext` applies **global query filters** so that all queries are automatically scoped to the current tenant
- Tenant resolution is handled by `TenantResolutionMiddleware` via `X-Tenant-Slug` header or subdomain
- Platform (SuperAdmin) endpoints bypass tenant resolution entirely
