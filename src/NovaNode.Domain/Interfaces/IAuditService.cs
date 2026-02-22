namespace NovaNode.Domain.Interfaces;

/// <summary>
/// Audit logging abstraction.
/// </summary>
public interface IAuditService
{
    Task LogAsync(Guid? tenantId, Guid actorUserId, string action, string entityName, string? entityId, object? before, object? after, CancellationToken ct = default);
}
