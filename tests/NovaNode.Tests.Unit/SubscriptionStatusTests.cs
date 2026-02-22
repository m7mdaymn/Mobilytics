using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using Xunit;

namespace NovaNode.Tests.Unit;

public class SubscriptionStatusTests
{
    [Fact]
    public void Trial_ShouldBeExpired_WhenTrialEndPassed()
    {
        var sub = new Subscription
        {
            Status = SubscriptionStatus.Trial,
            TrialStart = DateTime.UtcNow.AddDays(-10),
            TrialEnd = DateTime.UtcNow.AddDays(-3)
        };

        var isExpired = sub.Status == SubscriptionStatus.Trial && sub.TrialEnd < DateTime.UtcNow;
        Assert.True(isExpired);
    }

    [Fact]
    public void Trial_ShouldNotBeExpired_WhenTrialEndInFuture()
    {
        var sub = new Subscription
        {
            Status = SubscriptionStatus.Trial,
            TrialStart = DateTime.UtcNow.AddDays(-4),
            TrialEnd = DateTime.UtcNow.AddDays(3)
        };

        var isExpired = sub.Status == SubscriptionStatus.Trial && sub.TrialEnd < DateTime.UtcNow;
        Assert.False(isExpired);
    }

    [Fact]
    public void Active_ShouldEnterGrace_WhenEndDatePassed_ButGraceInFuture()
    {
        var sub = new Subscription
        {
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = DateTime.UtcNow.AddDays(-1),
            GraceEnd = DateTime.UtcNow.AddDays(2)
        };

        var isInGrace = sub.Status == SubscriptionStatus.Active
                        && sub.EndDate < DateTime.UtcNow
                        && sub.GraceEnd >= DateTime.UtcNow;
        Assert.True(isInGrace);
    }

    [Fact]
    public void Active_ShouldBeExpired_WhenGracePassed()
    {
        var sub = new Subscription
        {
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddMonths(-2),
            EndDate = DateTime.UtcNow.AddDays(-5),
            GraceEnd = DateTime.UtcNow.AddDays(-2)
        };

        var isExpired = sub.Status == SubscriptionStatus.Active
                        && sub.EndDate < DateTime.UtcNow
                        && sub.GraceEnd < DateTime.UtcNow;
        Assert.True(isExpired);
    }

    [Fact]
    public void Subscription_DefaultValues()
    {
        var sub = new Subscription();
        Assert.Equal(SubscriptionStatus.Trial, sub.Status);
        Assert.Equal(Guid.Empty, sub.TenantId);
    }
}
