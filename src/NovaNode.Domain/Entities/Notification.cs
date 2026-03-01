using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// In-app notification for tenant admin/owner.
/// </summary>
public class Notification : TenantEntity
{
    public string Type { get; set; } = string.Empty;   // e.g. "invoice.created", "lead.new", "item.low_stock"
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string? ActionUrl { get; set; }              // relative link e.g. "/items/abc123"
    public bool IsRead { get; set; }
}
