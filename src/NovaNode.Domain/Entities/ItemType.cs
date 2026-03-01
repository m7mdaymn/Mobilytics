using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Item type / section (e.g., Mobiles, Accessories, Tablets).
/// </summary>
public class ItemType : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsDevice { get; set; }
    public bool IsStockItem { get; set; }
    public bool SupportsIMEI { get; set; }
    public bool SupportsSerial { get; set; }
    public bool SupportsBatteryHealth { get; set; }
    public bool SupportsWarranty { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsVisibleInNav { get; set; } = true;
    public int DisplayOrder { get; set; }

    public ICollection<Item> Items { get; set; } = [];
    public ICollection<CustomFieldDefinition> CustomFieldDefinitions { get; set; } = [];
}
