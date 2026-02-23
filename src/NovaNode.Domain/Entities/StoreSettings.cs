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
    /// <summary>Theme preset (1-6). Each maps to a predefined color palette.</summary>
    public int ThemePresetId { get; set; } = 1;
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

    // ── Theme Presets (static lookup) ──
    public static readonly Dictionary<int, ThemePreset> Presets = new()
    {
        [1] = new("Midnight Pro", "#111827", "#374151", "#f59e0b"),
        [2] = new("Ocean Blue", "#1e40af", "#1e3a5f", "#06b6d4"),
        [3] = new("Forest Green", "#065f46", "#064e3b", "#34d399"),
        [4] = new("Royal Purple", "#5b21b6", "#4c1d95", "#a78bfa"),
        [5] = new("Sunset Orange", "#c2410c", "#9a3412", "#fb923c"),
        [6] = new("Slate Minimal", "#0f172a", "#334155", "#94a3b8"),
    };

    public record ThemePreset(string Name, string Primary, string Secondary, string Accent);
}
