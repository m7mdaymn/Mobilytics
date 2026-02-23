using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Reports;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;
    public ReportService(AppDbContext db) => _db = db;

    public async Task<DashboardDto> GetDashboardAsync(Guid tenantId, DashboardFilterRequest filter, CancellationToken ct = default)
    {
        var (from, to) = GetDateRange(filter);

        var invoices = _db.Invoices.Where(i => i.TenantId == tenantId && i.CreatedAt >= from && i.CreatedAt <= to && !i.IsRefund);
        var refunds = _db.Invoices.Where(i => i.TenantId == tenantId && i.CreatedAt >= from && i.CreatedAt <= to && i.IsRefund);
        var expenses = _db.Expenses.Where(e => e.TenantId == tenantId && e.OccurredAt >= from && e.OccurredAt <= to);
        var leads = _db.Leads.Where(l => l.TenantId == tenantId && l.CreatedAt >= from && l.CreatedAt <= to);

        var totalSales = await invoices.SumAsync(i => (decimal?)i.Total, ct) ?? 0;
        var totalRefunds = await refunds.SumAsync(i => (decimal?)i.Total, ct) ?? 0;
        var totalExpenses = await expenses.SumAsync(e => (decimal?)e.Amount, ct) ?? 0;
        var netSales = totalSales + totalRefunds;

        var invoiceItems = _db.InvoiceItems
            .Where(ii => ii.Invoice.TenantId == tenantId && ii.Invoice.CreatedAt >= from && ii.Invoice.CreatedAt <= to && !ii.Invoice.IsRefund);

        var devicesSold = await invoiceItems.Where(ii => ii.Item != null && ii.Item.ItemType.IsDevice).CountAsync(ct);
        var accessoriesQty = await invoiceItems.Where(ii => ii.Item != null && ii.Item.ItemType.IsStockItem).SumAsync(ii => (int?)ii.Quantity, ct) ?? 0;

        var itemsInStock = await _db.Items.CountAsync(i => i.TenantId == tenantId && i.Status == ItemStatus.Available, ct);

        // ── Sales trend (daily totals) ──
        var salesTrend = await _db.Invoices
            .Where(i => i.TenantId == tenantId && i.CreatedAt >= from && i.CreatedAt <= to && !i.IsRefund)
            .GroupBy(i => i.CreatedAt.Date)
            .Select(g => new TrendPointDto { Date = g.Key.ToString("yyyy-MM-dd"), Value = g.Sum(x => x.Total) })
            .OrderBy(x => x.Date)
            .ToListAsync(ct);

        // ── Leads trend (daily counts) ──
        var leadsTrend = await _db.Leads
            .Where(l => l.TenantId == tenantId && l.CreatedAt >= from && l.CreatedAt <= to)
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new TrendPointDto { Date = g.Key.ToString("yyyy-MM-dd"), Value = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync(ct);

        var topItemTypes = await invoiceItems.Where(ii => ii.Item != null)
            .GroupBy(ii => ii.Item!.ItemType.Name)
            .Select(g => new TopItemTypeDto { Name = g.Key, SoldCount = g.Count(), Revenue = g.Sum(x => x.LineTotal) })
            .OrderByDescending(x => x.Revenue).Take(5).ToListAsync(ct);

        var topLeads = await leads.Where(l => l.TargetTitleSnapshot != null)
            .GroupBy(l => l.TargetTitleSnapshot!)
            .Select(g => new TopLeadTargetDto { ItemTitle = g.Key, LeadCount = g.Count() })
            .OrderByDescending(x => x.LeadCount).Take(5).ToListAsync(ct);

        var lowStock = await _db.Items.Where(i => i.TenantId == tenantId && i.ItemType.IsStockItem && i.Quantity <= 3 && i.Status == ItemStatus.Available)
            .Select(i => new LowStockItemDto { Id = i.Id, Title = i.Title, Quantity = i.Quantity })
            .Take(10).ToListAsync(ct);

        var missingImages = await _db.Items.Where(i => i.TenantId == tenantId && i.MainImageUrl == null && i.Status == ItemStatus.Available)
            .Select(i => new MissingInfoItemDto { Id = i.Id, Title = i.Title })
            .Take(10).ToListAsync(ct);

        var missingPrice = await _db.Items.Where(i => i.TenantId == tenantId && i.Price == 0 && i.Status == ItemStatus.Available)
            .Select(i => new MissingInfoItemDto { Id = i.Id, Title = i.Title })
            .Take(10).ToListAsync(ct);

        // ── Recent invoices ──
        var recentInvoices = await _db.Invoices
            .Where(i => i.TenantId == tenantId)
            .OrderByDescending(i => i.CreatedAt)
            .Take(10)
            .Select(i => new RecentInvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerName = i.CustomerName,
                Total = i.Total,
                PaymentMethod = i.PaymentMethod.ToString(),
                IsRefund = i.IsRefund,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync(ct);

        return new DashboardDto
        {
            TotalSales = netSales,
            TotalExpenses = totalExpenses,
            NetAfterExpenses = netSales - totalExpenses,
            InvoicesCount = await invoices.CountAsync(ct),
            DevicesSoldCount = devicesSold,
            AccessoriesSoldQty = accessoriesQty,
            LeadsCount = await leads.CountAsync(ct),
            ItemsInStock = itemsInStock,
            SalesTrend = salesTrend,
            LeadsTrend = leadsTrend,
            TopItemTypes = topItemTypes,
            TopLeadsTargets = topLeads,
            LowStockItems = lowStock,
            MissingImagesItems = missingImages,
            MissingPriceItems = missingPrice,
            RecentInvoices = recentInvoices
        };
    }

    private static (DateTime from, DateTime to) GetDateRange(DashboardFilterRequest filter)
    {
        var to = filter.To ?? DateTime.UtcNow;
        var from = filter.Range?.ToLowerInvariant() switch
        {
            "today" => to.Date,
            "7d" => to.AddDays(-7),
            "30d" => to.AddDays(-30),
            "custom" => filter.From ?? to.AddDays(-30),
            _ => to.AddDays(-30)
        };
        return (from, to);
    }
}
