# Nova Node Documentation

## Table of Contents

| # | Document | Description |
|---|----------|-------------|
| 01 | [Architecture](01-architecture.md) | Clean Architecture overview, project structure, tech stack |
| 02 | [Getting Started](02-getting-started.md) | Prerequisites, setup, running the app, running tests |
| 03 | [API Reference](03-api-reference.md) | Complete endpoint reference (73 endpoints) |
| 04 | [Authentication](04-authentication.md) | JWT auth, roles, permissions, token structure |
| 05 | [Multi-Tenancy](05-multi-tenancy.md) | Tenant resolution, data isolation, global query filters |
| 06 | [Data Model](06-data-model.md) | Entity relationships, properties, enumerations |
| 07 | [Middleware](07-middleware.md) | Pipeline order, middleware descriptions |
| 08 | [Error Handling](08-error-handling.md) | Response envelope, HTTP status codes, exception mapping |
| 09 | [Database](09-database.md) | EF Core, migrations, seeding, DbContext |
| 10 | [Testing](10-testing.md) | Test strategy, unit tests (39), integration tests (11) |
| 11 | [Deployment](11-deployment.md) | Docker, IIS, production configuration, security checklist |
| 12 | [Configuration](12-configuration.md) | appsettings reference, NuGet packages |
| 13 | [Dependency Injection](13-dependency-injection.md) | Service registrations, lifetimes, interfaces |
| 14 | [Subscriptions](14-subscriptions.md) | Subscription lifecycle, plans, enforcement |

## Quick Links

- **Swagger UI:** `https://localhost:5001/swagger`
- **Default Admin:** `admin@novanode.com` / `Admin@123`
- **Run Tests:** `dotnet test`
- **Build:** `dotnet build`
