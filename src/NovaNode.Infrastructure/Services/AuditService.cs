using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Employees;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<AuditLogDto>> GetLogsAsync(Guid tenantId, int page, int pageSize, CancellationToken ct = default)
    {
        return await _db.AuditLogs
            .Where(a => a.TenantId == tenantId)
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                ActorUserId = a.ActorUserId,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                BeforeJson = a.BeforeJson,
                AfterJson = a.AfterJson,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(ct);
    }

    public async Task LogAsync(Guid? tenantId, Guid actorId, string action, string entityName, string? entityId, string? before, string? after, CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            TenantId = tenantId,
            ActorUserId = actorId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            BeforeJson = before,
            AfterJson = after
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);
    }
}
