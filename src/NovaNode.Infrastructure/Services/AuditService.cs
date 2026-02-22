using System.Text.Json;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(Guid? tenantId, Guid actorUserId, string action, string entityName, string? entityId, object? before, object? after, CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            TenantId = tenantId,
            ActorUserId = actorUserId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            BeforeJson = before != null ? JsonSerializer.Serialize(before) : null,
            AfterJson = after != null ? JsonSerializer.Serialize(after) : null
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);
    }
}
