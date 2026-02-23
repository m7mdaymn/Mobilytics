using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Platform-level invoice for tenant subscription payments (activation, renewal, etc.)
/// NOT tenant-scoped — used by SuperAdmin only.
/// </summary>
public class PlatformInvoice : AuditableEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public Guid? PlanId { get; set; }
    public Guid? SubscriptionId { get; set; }

    /// <summary>Activation, Renewal, Trial, Custom</summary>
    public string InvoiceType { get; set; } = "Activation";

    public int Months { get; set; } = 1;
    public decimal ActivationFee { get; set; }
    public decimal SubscriptionAmount { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Paid;

    public string? Notes { get; set; }
    public string? PdfPath { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Plan? Plan { get; set; }
    public Subscription? Subscription { get; set; }
}
