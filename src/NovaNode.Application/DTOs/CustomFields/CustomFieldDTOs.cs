using NovaNode.Domain.Enums;

namespace NovaNode.Application.DTOs.CustomFields;

public class CustomFieldDto
{
    public Guid Id { get; set; }
    public Guid? ItemTypeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public CustomFieldType FieldType { get; set; }
    public string? OptionsJson { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCustomFieldRequest
{
    public Guid? ItemTypeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public CustomFieldType FieldType { get; set; }
    public string? OptionsJson { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateCustomFieldRequest
{
    public Guid? ItemTypeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public CustomFieldType FieldType { get; set; }
    public string? OptionsJson { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
