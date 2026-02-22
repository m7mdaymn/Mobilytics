using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Store settings per tenant.
/// </summary>
public class StoreSettings : BaseEntity
{
    public Guid TenantId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public int ThemeId { get; set; } = 1;
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? AccentColor { get; set; }
    public string CurrencyCode { get; set; } = "EGP";
    public string? FooterAddress { get; set; }
    public string? WorkingHours { get; set; }
    public string? SocialLinksJson { get; set; }
    public string? PoliciesJson { get; set; }
    public string? MapUrl { get; set; }
    public string? PwaSettingsJson { get; set; }
    public string? WhatsAppTemplatesJson { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
