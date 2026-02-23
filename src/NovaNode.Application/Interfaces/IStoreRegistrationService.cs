using NovaNode.Application.DTOs;

namespace NovaNode.Application.Interfaces;

public interface IStoreRegistrationService
{
    Task<StoreRegistrationDto> CreateRegistrationAsync(CreateStoreRegistrationDto dto);
    Task<StoreRegistrationDto> GetRegistrationAsync(Guid registrationId);
    Task<IEnumerable<StoreRegistrationDto>> GetPendingRegistrationsAsync();
    Task<IEnumerable<StoreRegistrationDto>> GetAllRegistrationsAsync(int pageNumber = 1, int pageSize = 10);
    Task<StoreRegistrationDto> ApproveRegistrationAsync(Guid registrationId, string? approvalNotes, Guid approvedByUserId);
    Task<StoreRegistrationDto> RejectRegistrationAsync(Guid registrationId, string rejectionReason, Guid rejectedByUserId);
    Task<StoreRegistrationDto> HoldRegistrationAsync(Guid registrationId, string? reason, Guid heldByUserId);
}
