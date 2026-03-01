using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Category with optional parent for tree structure.
/// </summary>
public class Category : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public Guid? ParentId { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsVisibleInNav { get; set; } = true;
    public string? MetaTitle { get; set; }
    public string? MetaDesc { get; set; }

    // Capability flags (merged from ItemType)
    public bool IsDevice { get; set; }
    public bool IsStockItem { get; set; }
    public bool SupportsIMEI { get; set; }
    public bool SupportsSerial { get; set; }
    public bool SupportsBatteryHealth { get; set; }
    public bool SupportsWarranty { get; set; }

    // Navigation
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = [];
    public ICollection<Item> Items { get; set; } = [];
    public ICollection<CustomFieldDefinition> CustomFieldDefinitions { get; set; } = [];
}
