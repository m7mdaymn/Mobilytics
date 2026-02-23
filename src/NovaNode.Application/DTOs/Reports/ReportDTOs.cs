namespace NovaNode.Application.DTOs.Reports;

public class DashboardDto
{
    // KPIs
    public decimal TotalSales { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetAfterExpenses { get; set; }
    public int InvoicesCount { get; set; }
    public int DevicesSoldCount { get; set; }
    public int AccessoriesSoldQty { get; set; }
    public int LeadsCount { get; set; }
    public int ItemsInStock { get; set; }

    // Trends
    public List<TrendPointDto> SalesTrend { get; set; } = [];
    public List<TrendPointDto> LeadsTrend { get; set; } = [];

    // Breakdowns
    public List<TopItemTypeDto> TopItemTypes { get; set; } = [];
    public List<TopLeadTargetDto> TopLeadsTargets { get; set; } = [];

    // Operational alerts
    public List<LowStockItemDto> LowStockItems { get; set; } = [];
    public List<MissingInfoItemDto> MissingImagesItems { get; set; } = [];
    public List<MissingInfoItemDto> MissingPriceItems { get; set; } = [];

    // Recent invoices
    public List<RecentInvoiceDto> RecentInvoices { get; set; } = [];
}

public class TrendPointDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class TopItemTypeDto
{
    public string Name { get; set; } = string.Empty;
    public int SoldCount { get; set; }
    public decimal Revenue { get; set; }
}

public class TopLeadTargetDto
{
    public string ItemTitle { get; set; } = string.Empty;
    public int LeadCount { get; set; }
}

public class LowStockItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class MissingInfoItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
}

public class RecentInvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public bool IsRefund { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DashboardFilterRequest
{
    public string Range { get; set; } = "30d"; // today, 7d, 30d, custom
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}
