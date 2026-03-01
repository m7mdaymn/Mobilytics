using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.MultiTenancy;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using Xunit;

namespace NovaNode.Tests.Unit;

public class InvoiceServiceTests
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
    public async Task CreateAsync_ShouldCreateInvoice_AndUpdateDeviceStatus()
    {
        var (db, tenantId) = CreateDb();

        var category = new Category { TenantId = tenantId, Name = "Device", Slug = "device", IsDevice = true };
        db.Categories.Add(category);

        var item = new Item
        {
            TenantId = tenantId, Title = "iPhone 15", Slug = "iphone-15",
            CategoryId = category.Id, Price = 1000, Quantity = 1,
            Status = ItemStatus.Available
        };
        db.Items.Add(item);

        var employee = new Employee
        {
            TenantId = tenantId, Name = "Test User", Email = "test@test.com",
            PasswordHash = "hash", Role = "Owner"
        };
        db.Employees.Add(employee);
        await db.SaveChangesAsync();

        var svc = new InvoiceService(db);

        var request = new Application.DTOs.Invoices.CreateInvoiceRequest
        {
            CustomerName = "John",
            Items = [new Application.DTOs.Invoices.CreateInvoiceItemRequest { ItemId = item.Id, Quantity = 1, UnitPrice = 1000 }]
        };

        var result = await svc.CreateAsync(tenantId, request, employee.Id);

        Assert.Equal("John", result.CustomerName);
        Assert.Equal(1000, result.Total);
        Assert.Single(result.Items);

        // The device item should now be Sold
        var updatedItem = await db.Items.FindAsync(item.Id);
        Assert.Equal(ItemStatus.Sold, updatedItem!.Status);
    }

    [Fact]
    public async Task CreateAsync_ShouldDecrementStockForStockItem()
    {
        var (db, tenantId) = CreateDb();

        var category = new Category { TenantId = tenantId, Name = "Accessory", Slug = "acc", IsStockItem = true };
        db.Categories.Add(category);

        var item = new Item
        {
            TenantId = tenantId, Title = "Screen Protector", Slug = "screen-protector",
            CategoryId = category.Id, Price = 50, Quantity = 10,
            Status = ItemStatus.Available
        };
        db.Items.Add(item);

        var employee = new Employee
        {
            TenantId = tenantId, Name = "Test User", Email = "test@test.com",
            PasswordHash = "hash", Role = "Owner"
        };
        db.Employees.Add(employee);
        await db.SaveChangesAsync();

        var svc = new InvoiceService(db);
        var request = new Application.DTOs.Invoices.CreateInvoiceRequest
        {
            CustomerName = "Jane",
            Items = [new Application.DTOs.Invoices.CreateInvoiceItemRequest { ItemId = item.Id, Quantity = 3, UnitPrice = 50 }]
        };

        var result = await svc.CreateAsync(tenantId, request, employee.Id);

        Assert.Equal(150, result.Total);
        var updatedItem = await db.Items.FindAsync(item.Id);
        Assert.Equal(7, updatedItem!.Quantity);
        Assert.Equal(ItemStatus.Available, updatedItem.Status); // Still available since stock > 0
    }
}
