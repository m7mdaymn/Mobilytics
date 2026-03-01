namespace NovaNode.Application.DTOs.Installments;

// ── Provider ──

public class InstallmentProviderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public int PlanCount { get; set; }
}

public class CreateProviderRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "BNPL";
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

public class UpdateProviderRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "BNPL";
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

// ── Plan ──

public class InstallmentPlanDto
{
    public Guid Id { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderType { get; set; } = string.Empty;
    public string? ProviderLogoUrl { get; set; }
    public Guid? ItemId { get; set; }
    public string? ItemTitle { get; set; }
    public int Months { get; set; }
    public decimal DownPayment { get; set; }
    public decimal AdminFees { get; set; }
    public decimal? DownPaymentPercent { get; set; }
    public decimal? AdminFeesPercent { get; set; }
    public decimal? InterestRate { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
}

public class CreateInstallmentPlanRequest
{
    public Guid ProviderId { get; set; }
    public Guid? ItemId { get; set; }
    public int Months { get; set; }
    public decimal DownPayment { get; set; }
    public decimal AdminFees { get; set; }
    public decimal? DownPaymentPercent { get; set; }
    public decimal? AdminFeesPercent { get; set; }
    public decimal? InterestRate { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateInstallmentPlanRequest
{
    public Guid ProviderId { get; set; }
    public Guid? ItemId { get; set; }
    public int Months { get; set; }
    public decimal DownPayment { get; set; }
    public decimal AdminFees { get; set; }
    public decimal? DownPaymentPercent { get; set; }
    public decimal? AdminFeesPercent { get; set; }
    public decimal? InterestRate { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Public-facing installment info for storefront item detail pages.
/// </summary>
public class ItemInstallmentInfoDto
{
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderType { get; set; } = string.Empty;
    public string? ProviderLogoUrl { get; set; }
    public int Months { get; set; }
    public decimal DownPayment { get; set; }
}
