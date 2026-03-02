using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.MultiTenancy;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace NovaNode.Tests.Unit;

public class PlatformServiceTests
{
    private static (AppDbContext db, IWebHostEnvironment env) CreateDb()
    {
        var tenantCtx = new TenantContext();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options, tenantCtx);
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        var env = new TestWebHostEnvironment(tempDir);
        return (db, env);
    }

    [Fact]
    public async Task CreateTenantAsync_ShouldCreateTenantWithOwner()
    {
        var (db, env) = CreateDb();
        // First add a plan (needed for test data)
        var plan = new Plan { Name = "Standard", PriceMonthly = 500 };
        db.Plans.Add(plan);
        await db.SaveChangesAsync();

        var svc = new PlatformService(db, env);
        var result = await svc.CreateTenantAsync(new Application.DTOs.Platform.CreateTenantRequest
        {
            Name = "Test Store",
            Slug = "test-store",
            OwnerName = "Owner",
            OwnerEmail = "owner@test.com",
            OwnerPassword = "Pass123"
        });

        Assert.Equal("Test Store", result.Name);
        Assert.Equal("test-store", result.Slug);
        Assert.Equal("Pending", result.Status); // No subscription yet

        // Verify employee was created
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Email == "owner@test.com");
        Assert.NotNull(employee);
        Assert.Equal("Owner", employee.Role);
    }

    [Fact]
    public async Task CreateTenantAsync_DuplicateSlug_ShouldThrow()
    {
        var (db, env) = CreateDb();
        db.Tenants.Add(new Tenant { Name = "Existing", Slug = "test-store" });
        await db.SaveChangesAsync();

        var svc = new PlatformService(db, env);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.CreateTenantAsync(new Application.DTOs.Platform.CreateTenantRequest
            {
                Name = "New Store",
                Slug = "test-store",
                OwnerName = "O",
                OwnerEmail = "o@t.com",
                OwnerPassword = "pass"
            }));
    }

    [Fact]
    public async Task SuspendTenantAsync_ShouldDeactivate()
    {
        var (db, env) = CreateDb();
        var tenant = new Tenant { Name = "Test", Slug = "test", IsActive = true };
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();

        var svc = new PlatformService(db, env);
        await svc.SuspendTenantAsync(tenant.Id);

        var updated = await db.Tenants.FindAsync(tenant.Id);
        Assert.False(updated!.IsActive);
    }

    [Fact]
    public async Task CreatePlanAsync_ShouldCreatePlan()
    {
        var (db, env) = CreateDb();
        var svc = new PlatformService(db, env);

        var result = await svc.CreatePlanAsync(new Application.DTOs.Platform.CreatePlanRequest
        {
            Name = "Pro", PriceMonthly = 1000, ActivationFee = 2000
        });

        Assert.Equal("Pro", result.Name);
        Assert.Equal(1000, result.PriceMonthly);
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldReturnCounts()
    {
        var (db, env) = CreateDb();
        db.Tenants.Add(new Tenant { Name = "T1", Slug = "t1", IsActive = true });
        db.Tenants.Add(new Tenant { Name = "T2", Slug = "t2", IsActive = false });
        await db.SaveChangesAsync();

        var svc = new PlatformService(db, env);
        var result = await svc.GetDashboardAsync("month");

        Assert.Equal(2, result.TotalTenants);
        Assert.Equal(1, result.ActiveTenants);
    }
}


public class TestWebHostEnvironment : IWebHostEnvironment
{
    public TestWebHostEnvironment(string path) { WebRootPath = path; ContentRootPath = path; }
    public string WebRootPath { get; set; }
    public string ContentRootPath { get; set; }
    public string EnvironmentName { get; set; } = "Test";
    public string ApplicationName { get; set; } = "Test";
    public Microsoft.Extensions.FileProviders.IFileProvider WebRootFileProvider { get; set; } = null!;
    public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
}

