using NovaNode.Infrastructure.MultiTenancy;
using Xunit;

namespace NovaNode.Tests.Unit;

public class TenantContextTests
{
    [Fact]
    public void Set_ShouldSetTenantIdAndSlug()
    {
        var ctx = new TenantContext();
        var id = Guid.NewGuid();

        ctx.Set(id, "test-store");

        Assert.Equal(id, ctx.TenantId);
        Assert.Equal("test-store", ctx.TenantSlug);
        Assert.True(ctx.IsResolved);
    }

    [Fact]
    public void IsResolved_ShouldBeFalse_WhenNotSet()
    {
        var ctx = new TenantContext();
        Assert.False(ctx.IsResolved);
        Assert.Null(ctx.TenantId);
        Assert.Null(ctx.TenantSlug);
    }

    [Fact]
    public void Set_CalledTwice_ShouldOverwrite()
    {
        var ctx = new TenantContext();
        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();

        ctx.Set(id1, "store-1");
        ctx.Set(id2, "store-2");

        Assert.Equal(id2, ctx.TenantId);
        Assert.Equal("store-2", ctx.TenantSlug);
    }
}
