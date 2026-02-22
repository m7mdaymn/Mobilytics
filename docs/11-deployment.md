# Nova Node — Deployment

## Prerequisites

- .NET 9 Runtime
- SQL Server (2019+ recommended)
- Reverse proxy (Nginx, Apache, IIS, or cloud load balancer)

## Build for Production

```bash
dotnet publish src/NovaNode.Api -c Release -o ./publish
```

## Configuration

### Environment Variables

Override `appsettings.json` with environment variables:

```bash
# Database
export ConnectionStrings__Default="Server=prod-db;Database=NovaNode;User Id=app;Password=***;Encrypt=True;TrustServerCertificate=False;"

# JWT (use a strong 64+ character key in production)
export Jwt__Key="<your-production-secret-key-at-least-64-characters-long>"
export Jwt__ExpiryMinutes="30"

# ASP.NET Core
export ASPNETCORE_ENVIRONMENT="Production"
export ASPNETCORE_URLS="http://+:5000"
```

### appsettings.Production.json

Create a production-specific config file:

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning"
    }
  }
}
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/NovaNode.Api -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "NovaNode.Api.dll"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__Default=Server=db;Database=NovaNode;User Id=sa;Password=YourStrong!Password;TrustServerCertificate=True;
      - Jwt__Key=<your-64-char-key>
    depends_on:
      - db

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong!Password
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql

volumes:
  sqldata:
```

## IIS Deployment

1. Install the [.NET 9 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/9.0)
2. Publish: `dotnet publish src/NovaNode.Api -c Release -o C:\inetpub\novanode`
3. Create an IIS site pointing to the publish folder
4. Set the Application Pool to "No Managed Code"
5. Configure environment variables in IIS

## File Uploads

Item images are stored in `wwwroot/uploads/`. In production:

- Ensure the app has write permissions to this directory
- Consider using cloud storage (Azure Blob, S3) by replacing `LocalFileStorage`
- Configure a CDN for serving uploaded images

## Health Monitoring

- Serilog logs are written to `logs/nova-{Date}.log` (rolling daily)
- Configure log aggregation (ELK, Azure Monitor, etc.) for production monitoring
- Consider adding ASP.NET Core Health Checks for uptime monitoring

## Security Checklist

- [ ] Change the default SuperAdmin password
- [ ] Use a strong JWT signing key (64+ characters)
- [ ] Restrict CORS to allowed origins only
- [ ] Enable HTTPS/TLS termination at the reverse proxy
- [ ] Use SQL Server authentication (not `sa` account)
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Enable rate limiting for login endpoints
- [ ] Regularly rotate JWT signing keys
