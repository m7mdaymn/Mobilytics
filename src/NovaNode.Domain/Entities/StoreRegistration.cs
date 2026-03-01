using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

public class StoreRegistration : BaseEntity
{
    // Store Information
    public required string StoreName { get; set; }
    public required string Category { get; set; }
    public required string Location { get; set; }

    // Owner Information
    public required string OwnerName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public string? WhatsApp { get; set; }
    public string? Address { get; set; }
    public string? PasswordHash { get; set; }

    // Business Details
    public required string NumberOfStores { get; set; }
    public string? MonthlyRevenue { get; set; }
    public string? Source { get; set; }

    // Registration Status
    public RegistrationStatus Status { get; set; } = RegistrationStatus.PendingApproval;
    public string? ApprovalNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }

    // System Properties
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string? RejectionReason { get; set; }
}
