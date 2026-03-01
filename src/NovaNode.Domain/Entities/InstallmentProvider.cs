using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Installment provider (Bank or BNPL) per tenant.
/// </summary>
public class InstallmentProvider : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "BNPL"; // Banks, BNPL
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }

    public ICollection<InstallmentPlan> Plans { get; set; } = [];
}
