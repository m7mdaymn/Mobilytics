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

        // Check if email already registered (pending or approved)
        var existingRegistration = await _db.StoreRegistrations
            .FirstOrDefaultAsync(x => x.Email == dto.Email &&
                (x.Status == RegistrationStatus.PendingApproval || x.Status == RegistrationStatus.Approved));

        if (existingRegistration is not null)
        {
            throw new InvalidOperationException(
                existingRegistration.Status == RegistrationStatus.Approved
                    ? "An account with this email already exists. Please login instead."
                    : "A registration with this email is already pending approval. Please check your email for updates.");
        }

        // Also check if an employee with this email already exists
        var existingEmployee = await _db.Employees.AnyAsync(e => e.Email == dto.Email);
        if (existingEmployee)
        {
            throw new InvalidOperationException("An account with this email already exists. Please login instead.");
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
            WhatsApp = dto.WhatsApp,
            Address = dto.Address,
            PasswordHash = !string.IsNullOrWhiteSpace(dto.Password) ? BCrypt.Net.BCrypt.HashPassword(dto.Password) : null,
            NumberOfStores = dto.NumberOfStores,
            MonthlyRevenue = dto.MonthlyRevenue,
            Source = dto.Source,
            Status = RegistrationStatus.PendingApproval,
            SubmittedAt = DateTime.UtcNow
        };

        _db.StoreRegistrations.Add(registration);

        // ── Immediately create tenant (INACTIVE) + owner employee so user can login ──
        var slug = registration.StoreName.ToLower()
            .Replace(" ", "-")
            .Replace("--", "-");
        var baseSlug = slug;
        var counter = 1;
        while (await _db.Tenants.AnyAsync(t => t.Slug == slug))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        var tenant = new Tenant
        {
            Name = registration.StoreName,
            Slug = slug,
            SupportPhone = registration.Phone,
            SupportWhatsApp = registration.WhatsApp,
            Address = !string.IsNullOrWhiteSpace(registration.Address) ? registration.Address : registration.Location,
            IsActive = false // INACTIVE until admin approves & sets plan
        };
        _db.Tenants.Add(tenant);

        // Create feature toggles
        _db.TenantFeatureToggles.Add(new TenantFeatureToggle { TenantId = tenant.Id });

        // Create owner employee
        var passwordHash = registration.PasswordHash ?? BCrypt.Net.BCrypt.HashPassword("Temp@1234");
        var owner = new Employee
        {
            TenantId = tenant.Id,
            Name = registration.OwnerName,
            Email = registration.Email,
            Phone = registration.Phone,
            PasswordHash = passwordHash,
            Role = "Owner",
            IsActive = true
        };
        _db.Employees.Add(owner);

        await _db.SaveChangesAsync();

        // Seed default content (brands, categories, item types, store settings, etc.)
        await Seeding.TenantDefaultDataSeeder.SeedAsync(_db, tenant.Id, registration.StoreName);

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

        // Find the tenant that was created during registration (by owner email)
        var owner = await _db.Employees.FirstOrDefaultAsync(e => e.Email == registration.Email);
        Tenant? tenant = null;

        if (owner != null)
        {
            tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == owner.TenantId);
        }

        if (tenant != null)
        {
            // Activate the tenant
            tenant.IsActive = true;
            _db.Tenants.Update(tenant);

            // Create a 14-day trial subscription if none exists
            var hasSubscription = await _db.Subscriptions.AnyAsync(s => s.TenantId == tenant.Id);
            if (!hasSubscription)
            {
                var defaultPlan = await _db.Plans.FirstOrDefaultAsync();
                if (defaultPlan != null)
                {
                    var trialEnd = DateTime.UtcNow.AddDays(14);
                    var subscription = new Subscription
                    {
                        TenantId = tenant.Id,
                        PlanId = defaultPlan.Id,
                        Status = SubscriptionStatus.Trial,
                        TrialStart = DateTime.UtcNow,
                        TrialEnd = trialEnd,
                        StartDate = DateTime.UtcNow,
                        EndDate = trialEnd
                    };
                    _db.Subscriptions.Add(subscription);
                }
            }

            // Ensure default data is seeded (idempotent)
            await Seeding.TenantDefaultDataSeeder.SeedAsync(_db, tenant.Id, registration.StoreName);
        }
        else
        {
            // Fallback: create tenant if it doesn't exist (legacy registrations)
            var slug = registration.StoreName.ToLower().Replace(" ", "-").Replace("--", "-");
            var baseSlug = slug;
            var counter = 1;
            while (await _db.Tenants.AnyAsync(t => t.Slug == slug))
            {
                slug = $"{baseSlug}-{counter++}";
            }

            tenant = new Tenant
            {
                Name = registration.StoreName,
                Slug = slug,
                SupportPhone = registration.Phone,
                SupportWhatsApp = registration.WhatsApp,
                Address = !string.IsNullOrWhiteSpace(registration.Address) ? registration.Address : registration.Location,
                IsActive = true
            };
            _db.Tenants.Add(tenant);

            _db.TenantFeatureToggles.Add(new TenantFeatureToggle { TenantId = tenant.Id });

            var passwordHash = registration.PasswordHash ?? BCrypt.Net.BCrypt.HashPassword("Temp@1234");
            _db.Employees.Add(new Employee
            {
                TenantId = tenant.Id,
                Name = registration.OwnerName,
                Email = registration.Email,
                Phone = registration.Phone,
                PasswordHash = passwordHash,
                Role = "Owner",
                IsActive = true
            });

            var defaultPlan = await _db.Plans.FirstOrDefaultAsync();
            if (defaultPlan != null)
            {
                var trialEnd = DateTime.UtcNow.AddDays(14);
                _db.Subscriptions.Add(new Subscription
                {
                    TenantId = tenant.Id,
                    PlanId = defaultPlan.Id,
                    Status = SubscriptionStatus.Trial,
                    TrialStart = DateTime.UtcNow,
                    TrialEnd = trialEnd,
                    StartDate = DateTime.UtcNow,
                    EndDate = trialEnd
                });
            }

            await _db.SaveChangesAsync();
            await Seeding.TenantDefaultDataSeeder.SeedAsync(_db, tenant.Id, registration.StoreName);
        }

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
        WhatsApp = registration.WhatsApp,
        Address = registration.Address,
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
