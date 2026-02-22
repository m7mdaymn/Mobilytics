using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Platform-level user (Super Admin).
/// </summary>
public class PlatformUser : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "SuperAdmin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
