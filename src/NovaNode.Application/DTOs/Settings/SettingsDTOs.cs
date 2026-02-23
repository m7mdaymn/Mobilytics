namespace NovaNode.Application.DTOs.Settings;

public class StoreSettingsDto
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
    public string? PwaSettingsJson { get; set; }
    public string? WhatsAppTemplatesJson { get; set; }
}

public class PublicSettingsDto
{
    public string StoreName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public int ThemePresetId { get; set; } = 1;
    public string PrimaryColor { get; set; } = "#111827";
    public string SecondaryColor { get; set; } = "#374151";
    public string AccentColor { get; set; } = "#f59e0b";
    public string CurrencyCode { get; set; } = "EGP";
    public string? FooterAddress { get; set; }
    public string? WorkingHours { get; set; }
    public string? SocialLinksJson { get; set; }
    public string? PoliciesJson { get; set; }
    public string? MapUrl { get; set; }
    public string? PwaSettingsJson { get; set; }
    public string? WhatsAppTemplatesJson { get; set; }
    public bool IsActive { get; set; }
    public bool PoweredByEnabled { get; set; }
}

public class UpdateThemeRequest
{
    public int ThemePresetId { get; set; } = 1;
}

public class UpdateFooterRequest
{
    public string? FooterAddress { get; set; }
    public string? WorkingHours { get; set; }
    public string? SocialLinksJson { get; set; }
    public string? PoliciesJson { get; set; }
    public string? MapUrl { get; set; }
}

public class UpdateWhatsAppTemplatesRequest
{
    public string? WhatsAppTemplatesJson { get; set; }
}

public class UpdatePwaRequest
{
    public string? PwaSettingsJson { get; set; }
}
