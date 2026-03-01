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

    // Header
    public string? HeaderNoticeText { get; set; }

    // About page
    public string? AboutTitle { get; set; }
    public string? AboutDescription { get; set; }
    public string? AboutImageUrl { get; set; }

    // Hero banners JSON: [{"imageUrl":"","title":"","subtitle":"","linkUrl":""}]
    public string? HeroBannersJson { get; set; }

    // Testimonials JSON: [{"name":"","text":"","rating":5,"imageUrl":""}]
    public string? TestimonialsJson { get; set; }

    // FAQ JSON: [{"question":"","answer":""}]
    public string? FaqJson { get; set; }

    // Trust badges JSON: ["Trusted Store","Fast Delivery"]
    public string? TrustBadgesJson { get; set; }

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
        [7] = new("Rose Gold", "#9f1239", "#881337", "#fda4af"),
        [8] = new("Arctic Blue", "#0369a1", "#075985", "#7dd3fc"),
    };

    public record ThemePreset(string Name, string Primary, string Secondary, string Accent);
}
