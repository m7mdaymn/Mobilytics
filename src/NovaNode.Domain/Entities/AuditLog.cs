using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Audit log entry.
/// </summary>
public class AuditLog : BaseEntity
{
    public Guid? TenantId { get; set; }
    public Guid ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
