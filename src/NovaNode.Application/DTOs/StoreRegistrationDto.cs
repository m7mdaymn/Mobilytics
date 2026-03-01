namespace NovaNode.Application.DTOs;

public class CreateStoreRegistrationDto
{
    public required string StoreName { get; set; }
    public required string Category { get; set; }
    public required string Location { get; set; }
    public required string OwnerName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public string? WhatsApp { get; set; }
    public string? Address { get; set; }
    public string? Password { get; set; }
    public required string NumberOfStores { get; set; }
    public string? MonthlyRevenue { get; set; }
    public string? Source { get; set; }
    public bool AgreeTerms { get; set; }
}

public class StoreRegistrationDto
{
    public Guid Id { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? WhatsApp { get; set; }
    public string? Address { get; set; }
    public string NumberOfStores { get; set; } = string.Empty;
    public string? MonthlyRevenue { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = "PendingApproval";
    public string? ApprovalNotes { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
}

public class ApproveStoreRegistrationDto
{
    public Guid RegistrationId { get; set; }
    public string? ApprovalNotes { get; set; }
    public string Status { get; set; } = "Approved"; // Approved, Rejected, OnHold
    public string? RejectionReason { get; set; }
}
