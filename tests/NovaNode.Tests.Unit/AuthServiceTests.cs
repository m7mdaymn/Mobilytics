using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.MultiTenancy;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace NovaNode.Tests.Unit;

public class AuthServiceTests
{
    private static (AppDbContext db, Guid tenantId, IConfiguration config) CreateDb()
    {
        var tenantId = Guid.NewGuid();
        var tenantCtx = new TenantContext();
        tenantCtx.Set(tenantId, "test");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options, tenantCtx);

        db.Tenants.Add(new Tenant { Id = tenantId, Name = "Test Store", Slug = "test" });
        db.SaveChanges();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSecretKeyForUnitTests12345678901234",
                ["Jwt:Issuer"] = "NovaNode",
                ["Jwt:Audience"] = "NovaNode"
            })
            .Build();

        return (db, tenantId, config);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnToken_WhenCredentialsValid()
    {
        var (db, tenantId, config) = CreateDb();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Pass123");
        db.Employees.Add(new Employee
        {
            TenantId = tenantId, Name = "Owner", Email = "owner@test.com",
            PasswordHash = passwordHash, Role = "Owner", IsActive = true
        });
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);
        var result = await svc.LoginAsync(tenantId, new LoginRequest { Email = "owner@test.com", Password = "Pass123" });

        Assert.NotNull(result.Token);
        Assert.NotEmpty(result.Token);
        Assert.Equal("Owner", result.User.Name);
        Assert.Equal("Owner", result.User.Role);
    }

    [Fact]
    public async Task LoginAsync_ShouldThrow_WhenPasswordWrong()
    {
        var (db, tenantId, config) = CreateDb();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Pass123");
        db.Employees.Add(new Employee
        {
            TenantId = tenantId, Name = "Owner", Email = "owner@test.com",
            PasswordHash = passwordHash, Role = "Owner", IsActive = true
        });
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.LoginAsync(tenantId, new LoginRequest { Email = "owner@test.com", Password = "WrongPass" }));
    }

    [Fact]
    public async Task LoginAsync_ShouldThrow_WhenEmployeeNotFound()
    {
        var (db, tenantId, config) = CreateDb();
        var svc = new AuthService(db, config);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.LoginAsync(tenantId, new LoginRequest { Email = "nonexistent@test.com", Password = "Pass123" }));
    }

    [Fact]
    public async Task LoginAsync_ShouldThrow_WhenEmployeeInactive()
    {
        var (db, tenantId, config) = CreateDb();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Pass123");
        db.Employees.Add(new Employee
        {
            TenantId = tenantId, Name = "Inactive", Email = "inactive@test.com",
            PasswordHash = passwordHash, Role = "Manager", IsActive = false
        });
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.LoginAsync(tenantId, new LoginRequest { Email = "inactive@test.com", Password = "Pass123" }));
    }

    [Fact]
    public async Task LoginAsync_ShouldNotCrossTenant()
    {
        var (db, tenantId, config) = CreateDb();
        var otherTenantId = Guid.NewGuid();
        db.Tenants.Add(new Tenant { Id = otherTenantId, Name = "Other Store", Slug = "other" });

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Pass123");
        db.Employees.Add(new Employee
        {
            TenantId = otherTenantId, Name = "Other Owner", Email = "other@test.com",
            PasswordHash = passwordHash, Role = "Owner", IsActive = true
        });
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);

        // Login with tenantId should not find employee from other tenant
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.LoginAsync(tenantId, new LoginRequest { Email = "other@test.com", Password = "Pass123" }));
    }

    [Fact]
    public async Task UnifiedLoginAsync_ShouldReturnTenantSlug()
    {
        var (db, tenantId, config) = CreateDb();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Pass123");
        db.Employees.Add(new Employee
        {
            TenantId = tenantId, Name = "Owner", Email = "owner@test.com",
            PasswordHash = passwordHash, Role = "Owner", IsActive = true
        });
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);
        var result = await svc.UnifiedLoginAsync(new LoginRequest { Email = "owner@test.com", Password = "Pass123" });

        Assert.Equal("test", result.TenantSlug);
        Assert.Equal("Test Store", result.TenantName);
        Assert.True(result.TenantActive);
        Assert.NotEmpty(result.Token);
    }

    [Fact]
    public async Task UnifiedLoginAsync_ShouldIncludePermissions()
    {
        var (db, tenantId, config) = CreateDb();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Pass123");
        var emp = new Employee
        {
            TenantId = tenantId, Name = "Manager", Email = "mgr@test.com",
            PasswordHash = passwordHash, Role = "Manager", IsActive = true
        };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        db.Permissions.Add(new Permission { TenantId = tenantId, EmployeeId = emp.Id, Key = "items.create", IsEnabled = true });
        db.Permissions.Add(new Permission { TenantId = tenantId, EmployeeId = emp.Id, Key = "items.edit", IsEnabled = true });
        db.Permissions.Add(new Permission { TenantId = tenantId, EmployeeId = emp.Id, Key = "brands.manage", IsEnabled = false });
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);
        var result = await svc.UnifiedLoginAsync(new LoginRequest { Email = "mgr@test.com", Password = "Pass123" });

        Assert.Contains("items.create", result.User.Permissions);
        Assert.Contains("items.edit", result.User.Permissions);
        Assert.DoesNotContain("brands.manage", result.User.Permissions); // disabled
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldUpdatePassword()
    {
        var (db, tenantId, config) = CreateDb();
        var oldHash = BCrypt.Net.BCrypt.HashPassword("OldPass123");
        var emp = new Employee
        {
            TenantId = tenantId, Name = "User", Email = "user@test.com",
            PasswordHash = oldHash, Role = "Owner", IsActive = true
        };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);
        await svc.ChangePasswordAsync(tenantId, emp.Id, new ChangePasswordRequest
        {
            CurrentPassword = "OldPass123",
            NewPassword = "NewPass456"
        });

        // Verify new password works
        var updated = await db.Employees.FindAsync(emp.Id);
        Assert.True(BCrypt.Net.BCrypt.Verify("NewPass456", updated!.PasswordHash));
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldThrow_WhenCurrentPasswordWrong()
    {
        var (db, tenantId, config) = CreateDb();
        var hash = BCrypt.Net.BCrypt.HashPassword("Pass123");
        var emp = new Employee
        {
            TenantId = tenantId, Name = "User", Email = "user@test.com",
            PasswordHash = hash, Role = "Owner", IsActive = true
        };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.ChangePasswordAsync(tenantId, emp.Id, new ChangePasswordRequest
            {
                CurrentPassword = "WrongPassword",
                NewPassword = "NewPass456"
            }));
    }

    [Fact]
    public async Task PlatformLoginAsync_ShouldReturnToken()
    {
        var (db, _, config) = CreateDb();
        var hash = BCrypt.Net.BCrypt.HashPassword("Admin123");
        db.PlatformUsers.Add(new PlatformUser
        {
            Email = "admin@novanode.com",
            PasswordHash = hash,
            Role = "SuperAdmin"
        });
        await db.SaveChangesAsync();

        var svc = new AuthService(db, config);
        var result = await svc.PlatformLoginAsync(new PlatformLoginRequest
        {
            Email = "admin@novanode.com",
            Password = "Admin123"
        });

        Assert.NotEmpty(result.Token);
    }
}
