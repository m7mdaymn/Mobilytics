namespace NovaNode.Application.DTOs.Reports;

public class DashboardDto
{
    public decimal TotalSales { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetAfterExpenses { get; set; }
    public int InvoicesCount { get; set; }
    public int DevicesSoldCount { get; set; }
    public int AccessoriesSoldQty { get; set; }
    public int LeadsCount { get; set; }
    public List<TopItemTypeDto> TopItemTypes { get; set; } = [];
    public List<TopLeadTargetDto> TopLeadsTargets { get; set; } = [];
    public List<LowStockItemDto> LowStockItems { get; set; } = [];
    public List<MissingInfoItemDto> MissingImagesItems { get; set; } = [];
    public List<MissingInfoItemDto> MissingPriceItems { get; set; } = [];
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

public class DashboardFilterRequest
{
    public string Range { get; set; } = "30d"; // today, 7d, 30d, custom
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}
