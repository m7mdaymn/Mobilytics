using NovaNode.Domain.Enums;

namespace NovaNode.Application.DTOs.Platform;

// ─── Tenant DTOs ────────────────────────────────────────

public class TenantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    /// <summary>"Active" | "Suspended" | "Pending" — derived from IsActive + subscription</summary>
    public string Status { get; set; } = "Active";
    public string? SupportPhone { get; set; }
    public string? SupportWhatsApp { get; set; }
    public string? Address { get; set; }
    public string? MapUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public TenantOwnerDto? Owner { get; set; }
    public SubscriptionSummaryDto? Subscription { get; set; }
    public FeatureToggleDto? Features { get; set; }
    public TenantStoreSettingsDto? StoreSettings { get; set; }
}

public class TenantOwnerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? WhatsApp { get; set; }
}

// ─── Store Settings DTO ─────────────────────────────────

public class TenantStoreSettingsDto
{
    public string StoreName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public int ThemePresetId { get; set; } = 1;
    public string CurrencyCode { get; set; } = "EGP";
    public string? FooterAddress { get; set; }
    public string? WorkingHours { get; set; }
    public string? SocialLinksJson { get; set; }
    public string? PoliciesJson { get; set; }
    public string? MapUrl { get; set; }
    public string? HeaderNoticeText { get; set; }
    public string? AboutTitle { get; set; }
    public string? AboutDescription { get; set; }
    public string? AboutImageUrl { get; set; }
    public string? HeroBannersJson { get; set; }
    public string? TestimonialsJson { get; set; }
    public string? FaqJson { get; set; }
    public string? TrustBadgesJson { get; set; }
    public string? WhatsAppTemplatesJson { get; set; }
    public string? PwaSettingsJson { get; set; }
}

public class UpdateStoreSettingsRequest
{
    public string StoreName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public int ThemePresetId { get; set; } = 1;
    public string CurrencyCode { get; set; } = "EGP";
    public string? FooterAddress { get; set; }
    public string? WorkingHours { get; set; }
    public string? SocialLinksJson { get; set; }
    public string? PoliciesJson { get; set; }
    public string? MapUrl { get; set; }
    public string? HeaderNoticeText { get; set; }
    public string? AboutTitle { get; set; }
    public string? AboutDescription { get; set; }
    public string? AboutImageUrl { get; set; }
    public string? HeroBannersJson { get; set; }
    public string? TestimonialsJson { get; set; }
    public string? FaqJson { get; set; }
    public string? TrustBadgesJson { get; set; }
    public string? WhatsAppTemplatesJson { get; set; }
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

// ─── Onboard DTOs ───────────────────────────────────────

/// <summary>
/// Full onboarding request: creates tenant + owner + subscription + settings + invoice in one transaction
/// </summary>
public class OnboardTenantRequest
{
    // Store info
    public string StoreName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? StorePhone { get; set; }
    public string? StoreWhatsApp { get; set; }
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string? SocialLinksJson { get; set; }
    public string? MapUrl { get; set; }
    public int ThemePresetId { get; set; } = 1;
    public string CurrencyCode { get; set; } = "EGP";
    public string? WorkingHours { get; set; }

    // Owner info
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }
    public string? OwnerWhatsApp { get; set; }
    public string OwnerPassword { get; set; } = string.Empty;

    // Plan & Subscription
    public Guid PlanId { get; set; }
    public int DurationMonths { get; set; } = 1;
    public bool IsTrial { get; set; }

    // Payment
    public decimal ActivationFeePaid { get; set; }
    public decimal SubscriptionAmountPaid { get; set; }
    public decimal Discount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public string? PaymentNotes { get; set; }
}

public class OnboardTenantResponse
{
    public TenantDto Tenant { get; set; } = null!;
    public PlatformInvoiceDto? Invoice { get; set; }
}

// ─── Subscription DTOs ──────────────────────────────────

public class SubscriptionSummaryDto
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public string? PlanName { get; set; }
    public string Status { get; set; } = "Trial";  // String for frontend: "Trial" | "Active" | "Grace" | "Expired" | "Cancelled"
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? GraceEndsAt { get; set; }
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

// ─── Plan DTOs ──────────────────────────────────────────

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

// ─── Subscription Action DTOs ───────────────────────────

public class StartTrialRequest
{
    public Guid PlanId { get; set; }
}

public class ActivateSubscriptionRequest
{
    public Guid PlanId { get; set; }
    public decimal PaymentAmount { get; set; }
    public int Months { get; set; } = 1;
    public string? Notes { get; set; }
}

public class RenewSubscriptionRequest
{
    public decimal PaymentAmount { get; set; }
    public int Months { get; set; } = 1;
    public string? Notes { get; set; }
}

public class UpdateSubscriptionRequest
{
    public int Months { get; set; }
    public string? Notes { get; set; }
}

// ─── Invoice DTOs ───────────────────────────────────────

public class PlatformInvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string? TenantName { get; set; }
    public string? TenantSlug { get; set; }
    public string? PlanName { get; set; }
    public string InvoiceType { get; set; } = "Activation";
    public int Months { get; set; }
    public decimal ActivationFee { get; set; }
    public decimal SubscriptionAmount { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string PaymentStatus { get; set; } = "Paid";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ─── Dashboard DTOs ─────────────────────────────────────

public class PlatformDashboardDto
{
    public int TotalTenants { get; set; }
    public int ActiveTenants { get; set; }
    public int TrialTenants { get; set; }
    public int ExpiredTenants { get; set; }
    public int SuspendedTenants { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public int ExpiringSubscriptions { get; set; }
    public int TotalLeads { get; set; }
    public List<TenantDto> RecentTenants { get; set; } = new();
    public List<RevenueChartPoint> RevenueChart { get; set; } = new();
    public List<PlatformInvoiceDto> RecentInvoices { get; set; } = new();
    public List<TenantRevenueBreakdownDto> TenantRevenueBreakdown { get; set; } = new();
}

public class RevenueChartPoint
{
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class TenantRevenueBreakdownDto
{
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantSlug { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public decimal TotalFees { get; set; }
    public decimal TotalSubscriptionRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal TotalPaid { get; set; }
    public int TotalMonths { get; set; }
    public DateTime? SubscriptionStart { get; set; }
    public DateTime? SubscriptionEnd { get; set; }
    public int InvoiceCount { get; set; }
}

// ─── Expiring Subscription DTOs ─────────────────────────

public class ExpiringSubscriptionDto
{
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantSlug { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public DateTime EndDate { get; set; }
    public int DaysRemaining { get; set; }
}
