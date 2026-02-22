using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.CustomFields;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class CustomFieldService : ICustomFieldService
{
    private readonly AppDbContext _db;
    public CustomFieldService(AppDbContext db) => _db = db;

    public async Task<List<CustomFieldDto>> GetAllAsync(Guid tenantId, Guid? itemTypeId = null, CancellationToken ct = default)
    {
        var query = _db.CustomFieldDefinitions.Where(cf => cf.TenantId == tenantId);
        if (itemTypeId.HasValue)
            query = query.Where(cf => cf.ItemTypeId == null || cf.ItemTypeId == itemTypeId.Value);
        return await query.OrderBy(cf => cf.DisplayOrder).Select(cf => MapDto(cf)).ToListAsync(ct);
    }

    public async Task<CustomFieldDto> CreateAsync(Guid tenantId, CreateCustomFieldRequest request, CancellationToken ct = default)
    {
        var cf = new CustomFieldDefinition
        {
            TenantId = tenantId, ItemTypeId = request.ItemTypeId,
            Key = request.Key, Label = request.Label, FieldType = request.FieldType,
            OptionsJson = request.OptionsJson, IsRequired = request.IsRequired,
            DisplayOrder = request.DisplayOrder
        };
        _db.CustomFieldDefinitions.Add(cf);
        await _db.SaveChangesAsync(ct);
        return MapDto(cf);
    }

    public async Task<CustomFieldDto> UpdateAsync(Guid tenantId, Guid id, UpdateCustomFieldRequest request, CancellationToken ct = default)
    {
        var cf = await _db.CustomFieldDefinitions.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("CustomField not found.");
        cf.ItemTypeId = request.ItemTypeId; cf.Key = request.Key; cf.Label = request.Label;
        cf.FieldType = request.FieldType; cf.OptionsJson = request.OptionsJson;
        cf.IsRequired = request.IsRequired; cf.DisplayOrder = request.DisplayOrder; cf.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        return MapDto(cf);
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var cf = await _db.CustomFieldDefinitions.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("CustomField not found.");
        _db.CustomFieldDefinitions.Remove(cf);
        await _db.SaveChangesAsync(ct);
    }

    private static CustomFieldDto MapDto(CustomFieldDefinition cf) => new()
    {
        Id = cf.Id, ItemTypeId = cf.ItemTypeId, Key = cf.Key, Label = cf.Label,
        FieldType = cf.FieldType, OptionsJson = cf.OptionsJson,
        IsRequired = cf.IsRequired, DisplayOrder = cf.DisplayOrder, IsActive = cf.IsActive
    };
}
