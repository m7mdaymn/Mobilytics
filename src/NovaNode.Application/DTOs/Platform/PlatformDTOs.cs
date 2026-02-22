using NovaNode.Domain.Enums;

namespace NovaNode.Application.DTOs.Platform;

public class TenantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? SupportPhone { get; set; }
    public string? SupportWhatsApp { get; set; }
    public string? Address { get; set; }
    public string? MapUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public SubscriptionSummaryDto? CurrentSubscription { get; set; }
    public FeatureToggleDto? Features { get; set; }
}

public class CreateTenantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? SupportPhone { get; set; }
    public string? SupportWhatsApp { get; set; }
    public string? Address { get; set; }
    public string? MapUrl { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPassword { get; set; } = string.Empty;
}

public class UpdateTenantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? SupportPhone { get; set; }
    public string? SupportWhatsApp { get; set; }
    public string? Address { get; set; }
    public string? MapUrl { get; set; }
}

public class SubscriptionSummaryDto
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public string? PlanName { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime? TrialEnd { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? GraceEnd { get; set; }
}

public class FeatureToggleDto
{
    public bool CanRemovePoweredBy { get; set; }
    public bool AdvancedReports { get; set; }
}

public class UpdateFeatureToggleRequest
{
    public bool CanRemovePoweredBy { get; set; }
    public bool AdvancedReports { get; set; }
}

public class PlanDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public decimal ActivationFee { get; set; }
    public string? LimitsJson { get; set; }
    public string? FeaturesJson { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePlanRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public decimal ActivationFee { get; set; }
    public string? LimitsJson { get; set; }
    public string? FeaturesJson { get; set; }
}

public class UpdatePlanRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public decimal ActivationFee { get; set; }
    public string? LimitsJson { get; set; }
    public string? FeaturesJson { get; set; }
    public bool IsActive { get; set; } = true;
}

public class StartTrialRequest
{
    public Guid PlanId { get; set; }
}

public class ActivateSubscriptionRequest
{
    public Guid PlanId { get; set; }
    public decimal PaymentAmount { get; set; }
    public string? Notes { get; set; }
}

public class RenewSubscriptionRequest
{
    public decimal PaymentAmount { get; set; }
    public int Months { get; set; } = 1;
    public string? Notes { get; set; }
}

public class PlatformDashboardDto
{
    public int TotalTenants { get; set; }
    public int ActiveTenants { get; set; }
    public int TrialTenants { get; set; }
    public int ExpiredTenants { get; set; }
    public int SuspendedTenants { get; set; }
    public decimal TotalRevenue { get; set; }
}
