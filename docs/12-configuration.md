# Nova Node — Configuration Reference

## appsettings.json

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=NovaNode;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "<64-character-symmetric-key>",
    "Issuer": "NovaNode",
    "Audience": "NovaNodeClients",
    "ExpiryMinutes": 60
  },
  "FileUpload": {
    "MaxSizeBytes": 5242880,
    "AllowedContentTypes": ["image/jpeg", "image/png", "image/webp"]
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "File",
        "Args": {
          "path": "logs/nova-.log",
          "rollingInterval": "Day"
        }
      }
    ]
  },
  "AllowedHosts": "*"
}
```

## Configuration Sections

### ConnectionStrings

| Key | Description | Required |
|-----|-------------|----------|
| `Default` | SQL Server connection string | Yes |

### Jwt

| Key | Description | Default |
|-----|-------------|---------|
| `Key` | HS256 signing key (min 64 chars) | — (required) |
| `Issuer` | Token issuer claim | `"NovaNode"` |
| `Audience` | Token audience claim | `"NovaNodeClients"` |
| `ExpiryMinutes` | Token lifetime in minutes | `60` |

### FileUpload

| Key | Description | Default |
|-----|-------------|---------|
| `MaxSizeBytes` | Maximum file upload size | `5242880` (5 MB) |
| `AllowedContentTypes` | Allowed MIME types for uploads | `["image/jpeg", "image/png", "image/webp"]` |

### Serilog

| Key | Description | Default |
|-----|-------------|---------|
| `MinimumLevel:Default` | Minimum log level | `"Information"` |
| `WriteTo` | Log sinks (Console + File) | Console + `logs/nova-{Date}.log` |

## Environment-Specific Overrides

| Environment | File | Notes |
|-------------|------|-------|
| Development | `appsettings.Development.json` | Verbose logging, local DB |
| Production | `appsettings.Production.json` | Warning-level logging |
| Testing | (in-memory) | Skips SQL Server, uses InMemory DB |

## NuGet Packages

### NovaNode.Api
| Package | Version |
|---------|---------|
| Asp.Versioning.Mvc | 8.1.1 |
| Asp.Versioning.Mvc.ApiExplorer | 8.1.1 |
| Microsoft.EntityFrameworkCore.Design | 9.0.7 |
| Serilog.AspNetCore | 10.0.0 |
| Swashbuckle.AspNetCore | 7.2.0 |

### NovaNode.Application
| Package | Version |
|---------|---------|
| FluentValidation | 12.1.1 |
| FluentValidation.DependencyInjectionExtensions | 12.1.1 |
| Microsoft.AspNetCore.Http.Features | 5.0.17 |
| Microsoft.Extensions.DependencyInjection.Abstractions | 10.0.3 |

### NovaNode.Domain
No NuGet packages (pure domain layer).

### NovaNode.Infrastructure
| Package | Version |
|---------|---------|
| BCrypt.Net-Next | 4.1.0 |
| Microsoft.AspNetCore.Authentication.JwtBearer | 9.0.7 |
| Microsoft.EntityFrameworkCore.SqlServer | 9.0.7 |
| Microsoft.EntityFrameworkCore.Tools | 9.0.7 |
| Serilog.AspNetCore | 10.0.0 |
| Serilog.Sinks.Console | 6.1.1 |
| Serilog.Sinks.File | 7.0.0 |
| System.IdentityModel.Tokens.Jwt | 8.16.0 |
