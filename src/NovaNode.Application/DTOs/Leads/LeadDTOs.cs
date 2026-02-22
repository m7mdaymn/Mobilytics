using NovaNode.Domain.Enums;

namespace NovaNode.Application.DTOs.Leads;

public class LeadDto
{
    public Guid Id { get; set; }
    public LeadSource Source { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public Guid? TargetItemId { get; set; }
    public string? TargetTitleSnapshot { get; set; }
    public decimal? TargetPriceSnapshot { get; set; }
    public string? PageUrl { get; set; }
    public string? ButtonLocation { get; set; }
    public LeadStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WhatsAppClickRequest
{
    public Guid? TargetItemId { get; set; }
    public string? PageUrl { get; set; }
    public string? ButtonLocation { get; set; }
}

public class FollowUpRequest
{
    public string? Name { get; set; }
    public string Phone { get; set; } = string.Empty;
    public Guid? TargetItemId { get; set; }
    public string? Message { get; set; }
}

public class UpdateLeadStatusRequest
{
    public LeadStatus Status { get; set; }
}

public class LeadFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public LeadSource? Source { get; set; }
    public LeadStatus? Status { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string? Search { get; set; }
}
