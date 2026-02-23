using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class StoreRegistrationService : IStoreRegistrationService
{
    private readonly AppDbContext _db;
    private readonly IValidator<CreateStoreRegistrationDto> _validator;

    public StoreRegistrationService(
        AppDbContext db,
        IValidator<CreateStoreRegistrationDto> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<StoreRegistrationDto> CreateRegistrationAsync(CreateStoreRegistrationDto dto)
    {
        // Validate
        var validationResult = await _validator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        // Check if email already has pending registration
        var existingRegistration = await _db.StoreRegistrations
            .FirstOrDefaultAsync(x => x.Email == dto.Email && x.Status == RegistrationStatus.PendingApproval);

        if (existingRegistration is not null)
        {
            throw new InvalidOperationException(
                "A registration with this email is already pending approval. Please check your email for updates.");
        }

        // Create registration
        var registration = new StoreRegistration
        {
            StoreName = dto.StoreName,
            Category = dto.Category,
            Location = dto.Location,
            OwnerName = dto.OwnerName,
            Email = dto.Email,
            Phone = dto.Phone,
            NumberOfStores = dto.NumberOfStores,
            MonthlyRevenue = dto.MonthlyRevenue,
            Source = dto.Source,
            Status = RegistrationStatus.PendingApproval,
            SubmittedAt = DateTime.UtcNow
        };

        _db.StoreRegistrations.Add(registration);
        await _db.SaveChangesAsync();

        return MapDto(registration);
    }

    public async Task<StoreRegistrationDto> GetRegistrationAsync(Guid registrationId)
    {
        var registration = await _db.StoreRegistrations.FirstOrDefaultAsync(x => x.Id == registrationId)
            ?? throw new KeyNotFoundException($"Store registration with ID {registrationId} not found.");

        return MapDto(registration);
    }

    public async Task<IEnumerable<StoreRegistrationDto>> GetPendingRegistrationsAsync()
    {
        var registrations = await _db.StoreRegistrations
            .Where(x => x.Status == RegistrationStatus.PendingApproval)
            .OrderByDescending(x => x.SubmittedAt)
            .ToListAsync();

        return registrations.Select(MapDto);
    }

    public async Task<IEnumerable<StoreRegistrationDto>> GetAllRegistrationsAsync(int pageNumber = 1, int pageSize = 10)
    {
        var registrations = await _db.StoreRegistrations
            .OrderByDescending(x => x.SubmittedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return registrations.Select(MapDto);
    }

    public async Task<StoreRegistrationDto> ApproveRegistrationAsync(Guid registrationId, string? approvalNotes, Guid approvedByUserId)
    {
        var registration = await _db.StoreRegistrations.FirstOrDefaultAsync(x => x.Id == registrationId)
            ?? throw new KeyNotFoundException($"Store registration with ID {registrationId} not found.");

        registration.Status = RegistrationStatus.Approved;
        registration.ApprovalNotes = approvalNotes;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.ApprovedByUserId = approvedByUserId;

        _db.StoreRegistrations.Update(registration);
        await _db.SaveChangesAsync();

        return MapDto(registration);
    }

    public async Task<StoreRegistrationDto> RejectRegistrationAsync(
        Guid registrationId,
        string rejectionReason,
        Guid rejectedByUserId)
    {
        var registration = await _db.StoreRegistrations.FirstOrDefaultAsync(x => x.Id == registrationId)
            ?? throw new KeyNotFoundException($"Store registration with ID {registrationId} not found.");

        registration.Status = RegistrationStatus.Rejected;
        registration.RejectionReason = rejectionReason;
        registration.ApprovedByUserId = rejectedByUserId; // Track who rejected it
        registration.ApprovedAt = DateTime.UtcNow;

        _db.StoreRegistrations.Update(registration);
        await _db.SaveChangesAsync();

        return MapDto(registration);
    }

    public async Task<StoreRegistrationDto> HoldRegistrationAsync(Guid registrationId, string? reason, Guid heldByUserId)
    {
        var registration = await _db.StoreRegistrations.FirstOrDefaultAsync(x => x.Id == registrationId)
            ?? throw new KeyNotFoundException($"Store registration with ID {registrationId} not found.");

        registration.Status = RegistrationStatus.OnHold;
        registration.ApprovalNotes = reason;
        registration.ApprovedByUserId = heldByUserId;

        _db.StoreRegistrations.Update(registration);
        await _db.SaveChangesAsync();

        return MapDto(registration);
    }

    private static StoreRegistrationDto MapDto(StoreRegistration registration) => new()
    {
        Id = registration.Id,
        StoreName = registration.StoreName,
        Category = registration.Category,
        Location = registration.Location,
        OwnerName = registration.OwnerName,
        Email = registration.Email,
        Phone = registration.Phone,
        NumberOfStores = registration.NumberOfStores,
        MonthlyRevenue = registration.MonthlyRevenue,
        Source = registration.Source,
        Status = registration.Status.ToString(),
        ApprovalNotes = registration.ApprovalNotes,
        SubmittedAt = registration.SubmittedAt,
        ApprovedAt = registration.ApprovedAt,
        RejectionReason = registration.RejectionReason
    };
}
