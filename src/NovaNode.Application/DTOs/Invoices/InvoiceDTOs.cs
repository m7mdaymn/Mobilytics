using NovaNode.Domain.Enums;

namespace NovaNode.Application.DTOs.Invoices;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public bool IsRefund { get; set; }
    public Guid? OriginalInvoiceId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = [];
}

public class InvoiceItemDto
{
    public Guid Id { get; set; }
    public Guid? ItemId { get; set; }
    public string ItemTitleSnapshot { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
    public TaxStatus TaxStatusSnapshot { get; set; }
    public decimal? VatPercentSnapshot { get; set; }
}

public class CreateInvoiceRequest
{
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public decimal Discount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public List<CreateInvoiceItemRequest> Items { get; set; } = [];
}

public class CreateInvoiceItemRequest
{
    public Guid? ItemId { get; set; }
    public string? ItemTitleOverride { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
}

public class RefundInvoiceRequest
{
    public List<RefundItemRequest> Items { get; set; } = [];
    public string? Notes { get; set; }
}

public class RefundItemRequest
{
    public Guid InvoiceItemId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class InvoiceFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string? Search { get; set; }
}
