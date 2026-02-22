# Nova Node — Getting Started

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) (9.0.307+)
- SQL Server (local or remote)
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Mobilytics
```

### 2. Configure the Database

Edit `src/NovaNode.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=NovaNode;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 3. Apply Migrations

```bash
dotnet ef database update --project src/NovaNode.Infrastructure --startup-project src/NovaNode.Api
```

### 4. Run the Application

```bash
dotnet run --project src/NovaNode.Api
```

The API will start on `https://localhost:5001` (or `http://localhost:5000`).

### 5. Access Swagger UI

Open [https://localhost:5001/swagger](https://localhost:5001/swagger) in your browser.

## Default Seed Data

On first startup, the `DatabaseSeeder` creates:

| Entity | Details |
|--------|---------|
| SuperAdmin | Email: `admin@novanode.com`, Password: `Admin@123` |
| Default Plan | Name: `Standard`, Monthly: 500 EGP, Activation: 1500 EGP |

## Running Tests

```bash
# All tests (50 total)
dotnet test

# Unit tests only (39 tests)
dotnet test tests/NovaNode.Tests.Unit

# Integration tests only (11 tests)
dotnet test tests/NovaNode.Tests.Integration
```

## Project Configuration

### JWT Settings

```json
{
  "Jwt": {
    "Key": "<64-character-secret-key>",
    "Issuer": "NovaNode",
    "Audience": "NovaNodeClients",
    "ExpiryMinutes": 60
  }
}
```

### File Upload Settings

```json
{
  "FileUpload": {
    "MaxSizeBytes": 5242880,
    "AllowedContentTypes": ["image/jpeg", "image/png", "image/webp"]
  }
}
```

### Logging

Serilog is configured to write to both Console and rolling file (`logs/nova-{Date}.log`).

## Environment Variables

For production, override settings via environment variables:

```bash
ConnectionStrings__Default="Server=prod-server;..."
Jwt__Key="your-production-secret-key"
```
