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
    /// <summary>Color theme (1-4). Controls brand colors / accent palette.</summary>
    public int ThemePresetId { get; set; } = 1;
    /// <summary>System theme (1-4). Controls layout style (Liquid Glass, Neumorphism, Glossy 3D, Slate Minimal).</summary>
    public int SystemThemeId { get; set; } = 4;
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

    // Offer banner (shown above nav bar, dismissible)
    public string? OfferBannerText { get; set; }
    public string? OfferBannerUrl { get; set; }

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

    // ── Color Presets (static lookup - black & white brand colors) ──
    public static readonly Dictionary<int, ColorPreset> ColorPresets = new()
    {
        [1] = new("Classic",    "#000000", "#111111", "#000000"),
        [2] = new("Soft Black", "#1a1a1a", "#333333", "#1a1a1a"),
        [3] = new("Charcoal",   "#222222", "#444444", "#222222"),
        [4] = new("Ink",        "#0a0a0a", "#1c1c1c", "#0a0a0a"),
    };

    // ── System Presets (static lookup - UI style, only Minimal available) ──
    public static readonly Dictionary<int, SystemPreset> SystemPresets = new()
    {
        [4] = new("Slate Minimal", "Ultra-clean Apple-inspired, frosted header"),
    };

    // Keep backward-compat: old Presets maps to ColorPresets
    public static readonly Dictionary<int, ThemePreset> Presets = new()
    {
        [1] = new("Classic",    "#000000", "#111111", "#000000"),
        [2] = new("Soft Black", "#1a1a1a", "#333333", "#1a1a1a"),
        [3] = new("Charcoal",   "#222222", "#444444", "#222222"),
        [4] = new("Ink",        "#0a0a0a", "#1c1c1c", "#0a0a0a"),
    };

    public record ThemePreset(string Name, string Primary, string Secondary, string Accent);
    public record ColorPreset(string Name, string Primary, string Secondary, string Accent);
    public record SystemPreset(string Name, string Description);
}
