using NovaNode.Domain.Enums;

namespace NovaNode.Application.DTOs.Items;

public class ItemDto
{
    public Guid Id { get; set; }
    public Guid ItemTypeId { get; set; }
    public string? ItemTypeName { get; set; }
    public Guid? BrandId { get; set; }
    public string? BrandName { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public TaxStatus TaxStatus { get; set; }
    public decimal? VatPercent { get; set; }
    public ItemCondition Condition { get; set; }
    public int? BatteryHealth { get; set; }
    public string? IMEI { get; set; }
    public string? SerialNumber { get; set; }
    public WarrantyType? WarrantyType { get; set; }
    public int? WarrantyMonths { get; set; }
    public int Quantity { get; set; }
    public ItemStatus Status { get; set; }
    public string? MainImageUrl { get; set; }
    public string? GalleryImagesJson { get; set; }
    public string? ChecklistJson { get; set; }
    public string? CustomFieldsJson { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateItemRequest
{
    public Guid ItemTypeId { get; set; }
    public Guid? BrandId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public TaxStatus TaxStatus { get; set; }
    public decimal? VatPercent { get; set; }
    public ItemCondition Condition { get; set; }
    public int? BatteryHealth { get; set; }
    public string? IMEI { get; set; }
    public string? SerialNumber { get; set; }
    public WarrantyType? WarrantyType { get; set; }
    public int? WarrantyMonths { get; set; }
    public int Quantity { get; set; } = 1;
    public string? ChecklistJson { get; set; }
    public string? CustomFieldsJson { get; set; }
    public bool IsFeatured { get; set; }
}

public class UpdateItemRequest
{
    public Guid ItemTypeId { get; set; }
    public Guid? BrandId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public TaxStatus TaxStatus { get; set; }
    public decimal? VatPercent { get; set; }
    public ItemCondition Condition { get; set; }
    public int? BatteryHealth { get; set; }
    public string? IMEI { get; set; }
    public string? SerialNumber { get; set; }
    public WarrantyType? WarrantyType { get; set; }
    public int? WarrantyMonths { get; set; }
    public int Quantity { get; set; }
    public string? ChecklistJson { get; set; }
    public string? CustomFieldsJson { get; set; }
    public bool IsFeatured { get; set; }
}

public class UpdateItemStatusRequest
{
    public ItemStatus Status { get; set; }
}

public class ItemFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? TypeId { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? BrandId { get; set; }
    public ItemCondition? Condition { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public ItemStatus? Status { get; set; }
    public string? Search { get; set; }
    public bool? Featured { get; set; }
    public string? Sort { get; set; }
}
