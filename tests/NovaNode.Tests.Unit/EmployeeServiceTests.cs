using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Employees;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.MultiTenancy;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using Xunit;

namespace NovaNode.Tests.Unit;

public class EmployeeServiceTests
{
    private static (AppDbContext db, Guid tenantId) CreateDb()
    {
        var tenantId = Guid.NewGuid();
        var tenantCtx = new TenantContext();
        tenantCtx.Set(tenantId, "test");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options, tenantCtx);
        db.Tenants.Add(new Tenant { Id = tenantId, Name = "Test", Slug = "test" });
        db.SaveChanges();
        return (db, tenantId);
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateEmployee()
    {
        var (db, tenantId) = CreateDb();
        var svc = new EmployeeService(db);

        var result = await svc.CreateAsync(tenantId, new CreateEmployeeRequest
        {
            Name = "John",
            Email = "john@test.com",
            Password = "Pass123",
            Role = "Manager"
        });

        Assert.Equal("John", result.Name);
        Assert.Equal("john@test.com", result.Email);
        Assert.Equal("Manager", result.Role);
    }

    [Fact]
    public async Task CreateAsync_ShouldHashPassword()
    {
        var (db, tenantId) = CreateDb();
        var svc = new EmployeeService(db);

        await svc.CreateAsync(tenantId, new CreateEmployeeRequest
        {
            Name = "John",
            Email = "john@test.com",
            Password = "Pass123",
            Role = "Manager"
        });

        var emp = await db.Employees.FirstAsync();
        Assert.NotEqual("Pass123", emp.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("Pass123", emp.PasswordHash));
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnEmployees()
    {
        var (db, tenantId) = CreateDb();
        db.Employees.Add(new Employee { TenantId = tenantId, Name = "A", Email = "a@t.com", PasswordHash = "h", Role = "Owner" });
        db.Employees.Add(new Employee { TenantId = tenantId, Name = "B", Email = "b@t.com", PasswordHash = "h", Role = "Manager" });
        await db.SaveChangesAsync();

        var svc = new EmployeeService(db);
        var result = await svc.GetAllAsync(tenantId);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_ShouldNotReturnOtherTenantEmployees()
    {
        var (db, tenantId) = CreateDb();
        var otherTenantId = Guid.NewGuid();

        db.Employees.Add(new Employee { TenantId = tenantId, Name = "A", Email = "a@t.com", PasswordHash = "h", Role = "Owner" });
        db.Employees.Add(new Employee { TenantId = otherTenantId, Name = "B", Email = "b@t.com", PasswordHash = "h", Role = "Owner" });
        await db.SaveChangesAsync();

        var svc = new EmployeeService(db);
        var result = await svc.GetAllAsync(tenantId);

        Assert.Single(result);
        Assert.Equal("A", result[0].Name);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateEmployee()
    {
        var (db, tenantId) = CreateDb();
        var emp = new Employee
        {
            TenantId = tenantId, Name = "John", Email = "john@t.com",
            PasswordHash = "h", Role = "Manager", IsActive = true
        };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        var svc = new EmployeeService(db);
        var result = await svc.UpdateAsync(tenantId, emp.Id, new UpdateEmployeeRequest
        {
            Name = "Jane", Email = "jane@t.com", Role = "Owner", IsActive = true
        });

        Assert.Equal("Jane", result.Name);
        Assert.Equal("jane@t.com", result.Email);
        Assert.Equal("Owner", result.Role);
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveEmployee()
    {
        var (db, tenantId) = CreateDb();
        var emp = new Employee { TenantId = tenantId, Name = "X", Email = "x@t.com", PasswordHash = "h", Role = "Manager" };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        var svc = new EmployeeService(db);
        await svc.DeleteAsync(tenantId, emp.Id);

        Assert.Empty(await db.Employees.ToListAsync());
    }

    [Fact]
    public async Task UpdatePermissionsAsync_ShouldSetPermissions()
    {
        var (db, tenantId) = CreateDb();
        var emp = new Employee { TenantId = tenantId, Name = "M", Email = "m@t.com", PasswordHash = "h", Role = "Manager" };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        var svc = new EmployeeService(db);
        await svc.UpdatePermissionsAsync(tenantId, emp.Id, new UpdatePermissionsRequest
        {
            Permissions =
            [
                new PermissionEntry { Key = "items.create", IsEnabled = true },
                new PermissionEntry { Key = "items.edit", IsEnabled = true },
                new PermissionEntry { Key = "brands.manage", IsEnabled = false }
            ]
        });

        var perms = await db.Permissions.Where(p => p.EmployeeId == emp.Id).ToListAsync();
        Assert.Equal(3, perms.Count);
        Assert.True(perms.First(p => p.Key == "items.create").IsEnabled);
        Assert.False(perms.First(p => p.Key == "brands.manage").IsEnabled);
    }

    [Fact]
    public async Task UpdatePermissionsAsync_ShouldReplaceExistingPermissions()
    {
        var (db, tenantId) = CreateDb();
        var emp = new Employee { TenantId = tenantId, Name = "M", Email = "m@t.com", PasswordHash = "h", Role = "Manager" };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        db.Permissions.Add(new Permission { TenantId = tenantId, EmployeeId = emp.Id, Key = "old.perm", IsEnabled = true });
        await db.SaveChangesAsync();

        var svc = new EmployeeService(db);
        await svc.UpdatePermissionsAsync(tenantId, emp.Id, new UpdatePermissionsRequest
        {
            Permissions = [new PermissionEntry { Key = "new.perm", IsEnabled = true }]
        });

        var perms = await db.Permissions.Where(p => p.EmployeeId == emp.Id).ToListAsync();
        Assert.Single(perms);
        Assert.Equal("new.perm", perms[0].Key);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldThrow_WhenNotFound()
    {
        var (db, tenantId) = CreateDb();
        var svc = new EmployeeService(db);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetByIdAsync(tenantId, Guid.NewGuid()));
    }
}
