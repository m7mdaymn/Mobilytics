using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Common;
using NovaNode.Application.DTOs.Invoices;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _db;
    public InvoiceService(AppDbContext db) => _db = db;

    public async Task<PagedResult<InvoiceDto>> GetAllAsync(Guid tenantId, InvoiceFilterRequest filter, CancellationToken ct = default)
    {
        var query = _db.Invoices.Include(inv => inv.Items).Include(inv => inv.CreatedBy)
            .Where(inv => inv.TenantId == tenantId);
        if (filter.From.HasValue) query = query.Where(inv => inv.CreatedAt >= filter.From.Value);
        if (filter.To.HasValue) query = query.Where(inv => inv.CreatedAt <= filter.To.Value);
        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(inv => inv.InvoiceNumber.Contains(filter.Search) ||
                (inv.CustomerName != null && inv.CustomerName.Contains(filter.Search)));

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(inv => inv.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize)
            .Select(inv => MapDto(inv)).ToListAsync(ct);

        return new PagedResult<InvoiceDto> { Items = items, TotalCount = total, Page = filter.Page, PageSize = filter.PageSize };
    }

    public async Task<InvoiceDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var inv = await _db.Invoices.Include(i => i.Items).Include(i => i.CreatedBy)
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        return MapDto(inv);
    }

    public async Task<InvoiceDto> CreateAsync(Guid tenantId, CreateInvoiceRequest request, Guid userId, CancellationToken ct = default)
    {
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        decimal subtotal = 0;
        decimal vatAmount = 0;
        var invoiceItems = new List<InvoiceItem>();

        foreach (var lineReq in request.Items)
        {
            Item? catalogItem = null;
            if (lineReq.ItemId.HasValue)
                catalogItem = await _db.Items.Include(i => i.ItemType).FirstOrDefaultAsync(i => i.Id == lineReq.ItemId.Value && i.TenantId == tenantId, ct);

            var title = lineReq.ItemTitleOverride ?? catalogItem?.Title ?? "Custom Item";
            var taxStatus = catalogItem?.TaxStatus ?? TaxStatus.Exempt;
            var vatPct = catalogItem?.VatPercent ?? 0;
            var lineTotal = lineReq.UnitPrice * lineReq.Quantity;
            var lineVat = taxStatus == TaxStatus.Taxable && vatPct > 0 ? lineTotal * vatPct / 100 : 0;

            invoiceItems.Add(new InvoiceItem
            {
                ItemId = lineReq.ItemId,
                ItemTitleSnapshot = title,
                UnitPrice = lineReq.UnitPrice,
                Quantity = lineReq.Quantity,
                LineTotal = lineTotal,
                TaxStatusSnapshot = taxStatus,
                VatPercentSnapshot = vatPct
            });

            subtotal += lineTotal;
            vatAmount += lineVat;

            // Update inventory
            if (catalogItem != null)
            {
                if (catalogItem.ItemType.IsDevice)
                {
                    catalogItem.Status = ItemStatus.Sold;
                    catalogItem.Quantity = 0;
                }
                else if (catalogItem.ItemType.IsStockItem)
                {
                    catalogItem.Quantity = Math.Max(0, catalogItem.Quantity - lineReq.Quantity);
                    if (catalogItem.Quantity == 0)
                        catalogItem.Status = ItemStatus.Sold;
                }
            }
        }

        var invoice = new Invoice
        {
            TenantId = tenantId,
            InvoiceNumber = invoiceNumber,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            Subtotal = subtotal,
            Discount = request.Discount,
            VatAmount = vatAmount,
            Total = subtotal - request.Discount + vatAmount,
            PaymentMethod = request.PaymentMethod,
            Notes = request.Notes,
            CreatedByUserId = userId,
            Items = invoiceItems
        };

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(tenantId, invoice.Id, ct);
    }

    public async Task<InvoiceDto> RefundAsync(Guid tenantId, Guid invoiceId, RefundInvoiceRequest request, Guid userId, CancellationToken ct = default)
    {
        var original = await _db.Invoices.Include(i => i.Items).ThenInclude(ii => ii.Item).ThenInclude(i => i!.ItemType)
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == invoiceId, ct)
            ?? throw new KeyNotFoundException("Invoice not found.");

        var refundItems = new List<InvoiceItem>();
        decimal refundTotal = 0;

        foreach (var ri in request.Items)
        {
            var origItem = original.Items.FirstOrDefault(ii => ii.Id == ri.InvoiceItemId)
                ?? throw new KeyNotFoundException($"Invoice item {ri.InvoiceItemId} not found.");

            var lineTotal = origItem.UnitPrice * ri.Quantity;
            refundTotal += lineTotal;

            refundItems.Add(new InvoiceItem
            {
                ItemId = origItem.ItemId,
                ItemTitleSnapshot = origItem.ItemTitleSnapshot,
                UnitPrice = origItem.UnitPrice,
                Quantity = ri.Quantity,
                LineTotal = lineTotal,
                TaxStatusSnapshot = origItem.TaxStatusSnapshot,
                VatPercentSnapshot = origItem.VatPercentSnapshot
            });

            // Restore inventory
            if (origItem.Item != null)
            {
                if (origItem.Item.ItemType.IsDevice)
                {
                    origItem.Item.Status = ItemStatus.Available;
                    origItem.Item.Quantity = 1;
                }
                else if (origItem.Item.ItemType.IsStockItem)
                {
                    origItem.Item.Quantity += ri.Quantity;
                    if (origItem.Item.Status == ItemStatus.Sold)
                        origItem.Item.Status = ItemStatus.Available;
                }
            }
        }

        var refundInvoice = new Invoice
        {
            TenantId = tenantId,
            InvoiceNumber = $"REF-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            CustomerName = original.CustomerName,
            CustomerPhone = original.CustomerPhone,
            Subtotal = -refundTotal,
            Discount = 0,
            VatAmount = 0,
            Total = -refundTotal,
            PaymentMethod = original.PaymentMethod,
            Notes = request.Notes ?? $"Refund for {original.InvoiceNumber}",
            CreatedByUserId = userId,
            IsRefund = true,
            OriginalInvoiceId = invoiceId,
            Items = refundItems
        };

        _db.Invoices.Add(refundInvoice);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(tenantId, refundInvoice.Id, ct);
    }

    private static InvoiceDto MapDto(Invoice inv) => new()
    {
        Id = inv.Id, InvoiceNumber = inv.InvoiceNumber,
        CustomerName = inv.CustomerName, CustomerPhone = inv.CustomerPhone,
        Subtotal = inv.Subtotal, Discount = inv.Discount, VatAmount = inv.VatAmount, Total = inv.Total,
        PaymentMethod = inv.PaymentMethod, Notes = inv.Notes,
        IsRefund = inv.IsRefund, OriginalInvoiceId = inv.OriginalInvoiceId,
        CreatedAt = inv.CreatedAt, CreatedByName = inv.CreatedBy?.Name,
        Items = inv.Items.Select(ii => new InvoiceItemDto
        {
            Id = ii.Id, ItemId = ii.ItemId, ItemTitleSnapshot = ii.ItemTitleSnapshot,
            UnitPrice = ii.UnitPrice, Quantity = ii.Quantity, LineTotal = ii.LineTotal,
            TaxStatusSnapshot = ii.TaxStatusSnapshot, VatPercentSnapshot = ii.VatPercentSnapshot
        }).ToList()
    };
}
