using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Lead captured from WhatsApp click or follow-up request.
/// </summary>
public class Lead : TenantEntity
{
    public LeadSource Source { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public Guid? TargetItemId { get; set; }
    public string? TargetTitleSnapshot { get; set; }
    public decimal? TargetPriceSnapshot { get; set; }
    public string? PageUrl { get; set; }
    public string? ButtonLocation { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;

    // Navigation
    public Item? TargetItem { get; set; }
}
