using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Sales invoice.
/// </summary>
public class Invoice : TenantEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByUserId { get; set; }
    public bool IsRefund { get; set; }
    public Guid? OriginalInvoiceId { get; set; }

    // Navigation
    public Invoice? OriginalInvoice { get; set; }
    public Employee? CreatedBy { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = [];
}
