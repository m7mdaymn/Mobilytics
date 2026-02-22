using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Custom field definition for item types.
/// </summary>
public class CustomFieldDefinition : TenantEntity
{
    public Guid? ItemTypeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public CustomFieldType FieldType { get; set; }
    public string? OptionsJson { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ItemType? ItemType { get; set; }
}
