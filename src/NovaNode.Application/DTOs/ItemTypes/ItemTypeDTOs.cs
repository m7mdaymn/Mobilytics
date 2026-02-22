namespace NovaNode.Application.DTOs.ItemTypes;

public class ItemTypeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsDevice { get; set; }
    public bool IsStockItem { get; set; }
    public bool SupportsIMEI { get; set; }
    public bool SupportsSerial { get; set; }
    public bool SupportsBatteryHealth { get; set; }
    public bool SupportsWarranty { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateItemTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public bool IsDevice { get; set; }
    public bool IsStockItem { get; set; }
    public bool SupportsIMEI { get; set; }
    public bool SupportsSerial { get; set; }
    public bool SupportsBatteryHealth { get; set; }
    public bool SupportsWarranty { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateItemTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public bool IsDevice { get; set; }
    public bool IsStockItem { get; set; }
    public bool SupportsIMEI { get; set; }
    public bool SupportsSerial { get; set; }
    public bool SupportsBatteryHealth { get; set; }
    public bool SupportsWarranty { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
