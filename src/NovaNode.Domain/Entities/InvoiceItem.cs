using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Line item on an invoice.
/// </summary>
public class InvoiceItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid? ItemId { get; set; }
    public string ItemTitleSnapshot { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal LineTotal { get; set; }
    public TaxStatus TaxStatusSnapshot { get; set; }
    public decimal? VatPercentSnapshot { get; set; }

    // Navigation
    public Invoice Invoice { get; set; } = null!;
    public Item? Item { get; set; }
}
