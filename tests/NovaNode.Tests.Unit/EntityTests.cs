using NovaNode.Domain.Common;
using NovaNode.Domain.Entities;
using Xunit;

namespace NovaNode.Tests.Unit;

public class EntityTests
{
    [Fact]
    public void BaseEntity_ShouldHaveNewGuid()
    {
        var entity = new Brand();
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void AuditableEntity_ShouldHaveTimestamps()
    {
        var entity = new Brand();
        Assert.True(entity.CreatedAt <= DateTime.UtcNow);
        Assert.True(entity.UpdatedAt <= DateTime.UtcNow);
    }

    [Fact]
    public void TenantEntity_ShouldHaveTenantId()
    {
        var tenantId = Guid.NewGuid();
        var entity = new Brand { TenantId = tenantId };
        Assert.Equal(tenantId, entity.TenantId);
    }

    [Fact]
    public void Item_DefaultValues()
    {
        var item = new Item();
        Assert.Equal(Domain.Enums.ItemCondition.New, item.Condition);
        Assert.Equal(Domain.Enums.ItemStatus.Available, item.Status);
        Assert.False(item.IsFeatured);
        Assert.Equal(0, item.Quantity);
    }

    [Fact]
    public void Employee_DefaultRole_ShouldBeManager()
    {
        var emp = new Employee();
        Assert.Equal("Manager", emp.Role);
    }

    [Fact]
    public void Tenant_IsActive_DefaultTrue()
    {
        var tenant = new Tenant();
        Assert.True(tenant.IsActive);
    }

    [Fact]
    public void Plan_IsActive_DefaultTrue()
    {
        var plan = new Plan();
        Assert.True(plan.IsActive);
    }

    [Fact]
    public void PlatformUser_DefaultRole_SuperAdmin()
    {
        var user = new PlatformUser();
        Assert.Equal("SuperAdmin", user.Role);
    }

    [Fact]
    public void Category_Hierarchy()
    {
        var parent = new Category { Name = "Electronics" };
        var child = new Category { Name = "Phones", ParentId = parent.Id };
        parent.Children.Add(child);

        Assert.Single(parent.Children);
        Assert.Equal(parent.Id, child.ParentId);
    }
}
