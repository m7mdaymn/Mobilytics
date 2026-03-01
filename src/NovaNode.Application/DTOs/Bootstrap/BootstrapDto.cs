using NovaNode.Application.DTOs.Navigation;
using NovaNode.Application.DTOs.Settings;

namespace NovaNode.Application.DTOs.Bootstrap;

/// <summary>
/// Combined storefront bootstrap payload — replaces two separate calls
/// (/Public/settings + /Public/navigation) with a single request.
/// </summary>
public class BootstrapDto
{
    public PublicSettingsDto Settings { get; set; } = new();
    public NavigationDto Navigation { get; set; } = new();
}
