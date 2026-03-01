using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Unified catalog item.
/// </summary>
public class Item : TenantEntity
{
    public Guid? ItemTypeId { get; set; }
    public Guid? BrandId { get; set; }
    public Guid CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public TaxStatus TaxStatus { get; set; } = TaxStatus.Exempt;
    public decimal? VatPercent { get; set; }
    public ItemCondition Condition { get; set; } = ItemCondition.New;
    public int? BatteryHealth { get; set; }
    public string? IMEI { get; set; }
    public string? SerialNumber { get; set; }
    public WarrantyType? WarrantyType { get; set; }
    public int? WarrantyMonths { get; set; }
    public int Quantity { get; set; }
    public ItemStatus Status { get; set; } = ItemStatus.Available;
    public string? MainImageUrl { get; set; }
    public string? GalleryImagesJson { get; set; }
    public string? ChecklistJson { get; set; }
    public string? CustomFieldsJson { get; set; }
    public bool IsFeatured { get; set; }

    // Device-specific fields
    public string? Color { get; set; }
    public string? Storage { get; set; }
    public string? RAM { get; set; }
    public bool InstallmentAvailable { get; set; }
    public decimal? MonthlyPayment { get; set; }

    // Rich text content
    public string? Specs { get; set; }
    public string? WhatsInTheBox { get; set; }

    // Navigation
    public ItemType? ItemType { get; set; }
    public Brand? Brand { get; set; }
    public Category Category { get; set; } = null!;
    public ICollection<InvoiceItem> InvoiceItems { get; set; } = [];
    public ICollection<Lead> Leads { get; set; } = [];
    public ICollection<InstallmentPlan> InstallmentPlans { get; set; } = [];
}
