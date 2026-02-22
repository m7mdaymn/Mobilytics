using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Brand within a tenant.
/// </summary>
public class Brand : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Item> Items { get; set; } = [];
}
