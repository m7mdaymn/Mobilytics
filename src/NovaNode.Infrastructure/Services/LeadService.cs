using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Common;
using NovaNode.Application.DTOs.Leads;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class LeadService : ILeadService
{
    private readonly AppDbContext _db;
    public LeadService(AppDbContext db) => _db = db;

    public async Task<PagedResult<LeadDto>> GetAllAsync(Guid tenantId, LeadFilterRequest filter, CancellationToken ct = default)
    {
        var query = _db.Leads.Where(l => l.TenantId == tenantId);
        if (filter.Source.HasValue) query = query.Where(l => l.Source == filter.Source.Value);
        if (filter.Status.HasValue) query = query.Where(l => l.Status == filter.Status.Value);
        if (filter.From.HasValue) query = query.Where(l => l.CreatedAt >= filter.From.Value);
        if (filter.To.HasValue) query = query.Where(l => l.CreatedAt <= filter.To.Value);
        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(l => (l.CustomerName != null && l.CustomerName.Contains(filter.Search)) ||
                (l.CustomerPhone != null && l.CustomerPhone.Contains(filter.Search)));

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(l => l.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize)
            .Select(l => MapDto(l)).ToListAsync(ct);

        return new PagedResult<LeadDto> { Items = items, TotalCount = total, Page = filter.Page, PageSize = filter.PageSize };
    }

    public async Task<LeadDto> CreateWhatsAppClickAsync(Guid tenantId, WhatsAppClickRequest request, CancellationToken ct = default)
    {
        Item? item = null;
        if (request.TargetItemId.HasValue)
            item = await _db.Items.FindAsync([request.TargetItemId.Value], ct);

        var lead = new Lead
        {
            TenantId = tenantId, Source = LeadSource.WhatsAppClick,
            TargetItemId = request.TargetItemId,
            TargetTitleSnapshot = item?.Title,
            TargetPriceSnapshot = item?.Price,
            PageUrl = request.PageUrl, ButtonLocation = request.ButtonLocation
        };
        _db.Leads.Add(lead);
        await _db.SaveChangesAsync(ct);
        return MapDto(lead);
    }

    public async Task<LeadDto> CreateFollowUpAsync(Guid tenantId, FollowUpRequest request, CancellationToken ct = default)
    {
        Item? item = null;
        if (request.TargetItemId.HasValue)
            item = await _db.Items.FindAsync([request.TargetItemId.Value], ct);

        var lead = new Lead
        {
            TenantId = tenantId, Source = LeadSource.FollowUpRequest,
            CustomerName = request.Name, CustomerPhone = request.Phone,
            TargetItemId = request.TargetItemId,
            TargetTitleSnapshot = item?.Title,
            TargetPriceSnapshot = item?.Price
        };
        _db.Leads.Add(lead);
        await _db.SaveChangesAsync(ct);
        return MapDto(lead);
    }

    public async Task UpdateStatusAsync(Guid tenantId, Guid id, UpdateLeadStatusRequest request, CancellationToken ct = default)
    {
        var lead = await _db.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == id, ct)
            ?? throw new KeyNotFoundException("Lead not found.");
        lead.Status = request.Status;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string> GetFollowUpLinkAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var lead = await _db.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == id, ct)
            ?? throw new KeyNotFoundException("Lead not found.");
        if (string.IsNullOrEmpty(lead.CustomerPhone))
            throw new InvalidOperationException("Lead has no phone number.");

        var phone = lead.CustomerPhone.TrimStart('+');
        var message = Uri.EscapeDataString($"Hi {lead.CustomerName ?? "there"}! Following up about {lead.TargetTitleSnapshot ?? "your inquiry"}.");
        return $"https://wa.me/{phone}?text={message}";
    }

    public async Task<byte[]> ExportAsync(Guid tenantId, LeadFilterRequest filter, CancellationToken ct = default)
    {
        var query = _db.Leads.Where(l => l.TenantId == tenantId);
        if (filter.Source.HasValue) query = query.Where(l => l.Source == filter.Source.Value);
        if (filter.Status.HasValue) query = query.Where(l => l.Status == filter.Status.Value);
        if (filter.From.HasValue) query = query.Where(l => l.CreatedAt >= filter.From.Value);
        if (filter.To.HasValue) query = query.Where(l => l.CreatedAt <= filter.To.Value);

        var leads = await query.OrderByDescending(l => l.CreatedAt).ToListAsync(ct);

        // Simple CSV export
        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms);
        await writer.WriteLineAsync("Id,Source,CustomerName,CustomerPhone,TargetTitle,TargetPrice,Status,CreatedAt");
        foreach (var l in leads)
            await writer.WriteLineAsync($"{l.Id},{l.Source},{l.CustomerName},{l.CustomerPhone},{l.TargetTitleSnapshot},{l.TargetPriceSnapshot},{l.Status},{l.CreatedAt:O}");
        await writer.FlushAsync(ct);
        return ms.ToArray();
    }

    private static LeadDto MapDto(Lead l) => new()
    {
        Id = l.Id, Source = l.Source, CustomerName = l.CustomerName,
        CustomerPhone = l.CustomerPhone, TargetItemId = l.TargetItemId,
        TargetTitleSnapshot = l.TargetTitleSnapshot, TargetPriceSnapshot = l.TargetPriceSnapshot,
        PageUrl = l.PageUrl, ButtonLocation = l.ButtonLocation,
        Status = l.Status, CreatedAt = l.CreatedAt
    };
}
