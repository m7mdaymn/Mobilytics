using NovaNode.Domain.Common;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Stores custom spec field labels per tenant for reuse across items.
/// </summary>
public class SpecFieldTemplate : TenantEntity
{
    public string Label { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public string? OptionsJson { get; set; } // JSON array of string options
}
