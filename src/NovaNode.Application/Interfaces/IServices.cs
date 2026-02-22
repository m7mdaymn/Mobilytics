using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.DTOs.Brands;
using NovaNode.Application.DTOs.Categories;
using NovaNode.Application.DTOs.Common;
using NovaNode.Application.DTOs.CustomFields;
using NovaNode.Application.DTOs.Employees;
using NovaNode.Application.DTOs.Expenses;
using NovaNode.Application.DTOs.HomeSections;
using NovaNode.Application.DTOs.Invoices;
using NovaNode.Application.DTOs.Items;
using NovaNode.Application.DTOs.ItemTypes;
using NovaNode.Application.DTOs.Leads;
using NovaNode.Application.DTOs.Platform;
using NovaNode.Application.DTOs.Reports;
using NovaNode.Application.DTOs.Settings;

namespace NovaNode.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(Guid tenantId, LoginRequest request, CancellationToken ct = default);
    Task<LoginResponse> RefreshTokenAsync(Guid tenantId, string refreshToken, CancellationToken ct = default);
    Task<PlatformLoginResponse> PlatformLoginAsync(PlatformLoginRequest request, CancellationToken ct = default);
}

public interface IBrandService
{
    Task<List<BrandDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default);
    Task<BrandDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<BrandDto> CreateAsync(Guid tenantId, CreateBrandRequest request, CancellationToken ct = default);
    Task<BrandDto> UpdateAsync(Guid tenantId, Guid id, UpdateBrandRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
}

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default);
    Task<List<CategoryDto>> GetTreeAsync(Guid tenantId, CancellationToken ct = default);
    Task<CategoryDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<CategoryDto> CreateAsync(Guid tenantId, CreateCategoryRequest request, CancellationToken ct = default);
    Task<CategoryDto> UpdateAsync(Guid tenantId, Guid id, UpdateCategoryRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task ReorderAsync(Guid tenantId, ReorderRequest request, CancellationToken ct = default);
}

public interface IItemTypeService
{
    Task<List<ItemTypeDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default);
    Task<ItemTypeDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<ItemTypeDto> CreateAsync(Guid tenantId, CreateItemTypeRequest request, CancellationToken ct = default);
    Task<ItemTypeDto> UpdateAsync(Guid tenantId, Guid id, UpdateItemTypeRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
}

public interface ICustomFieldService
{
    Task<List<CustomFieldDto>> GetAllAsync(Guid tenantId, Guid? itemTypeId = null, CancellationToken ct = default);
    Task<CustomFieldDto> CreateAsync(Guid tenantId, CreateCustomFieldRequest request, CancellationToken ct = default);
    Task<CustomFieldDto> UpdateAsync(Guid tenantId, Guid id, UpdateCustomFieldRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
}

public interface IItemService
{
    Task<PagedResult<ItemDto>> GetAllAsync(Guid tenantId, ItemFilterRequest filter, CancellationToken ct = default);
    Task<ItemDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<ItemDto?> GetBySlugAsync(Guid tenantId, string slug, CancellationToken ct = default);
    Task<ItemDto> CreateAsync(Guid tenantId, CreateItemRequest request, CancellationToken ct = default);
    Task<ItemDto> UpdateAsync(Guid tenantId, Guid id, UpdateItemRequest request, CancellationToken ct = default);
    Task UpdateStatusAsync(Guid tenantId, Guid id, UpdateItemStatusRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<string> UploadImageAsync(Guid tenantId, Guid itemId, Stream stream, string fileName, string contentType, bool isMain, CancellationToken ct = default);
    Task DeleteImageAsync(Guid tenantId, Guid itemId, string imageKey, CancellationToken ct = default);
}

public interface IHomeSectionService
{
    Task<List<HomeSectionDto>> GetAllAsync(Guid tenantId, bool activeOnly = false, CancellationToken ct = default);
    Task<HomeSectionDto> CreateAsync(Guid tenantId, CreateHomeSectionRequest request, CancellationToken ct = default);
    Task<HomeSectionDto> UpdateAsync(Guid tenantId, Guid id, UpdateHomeSectionRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task ReorderAsync(Guid tenantId, ReorderRequest request, CancellationToken ct = default);
}

public interface ILeadService
{
    Task<PagedResult<LeadDto>> GetAllAsync(Guid tenantId, LeadFilterRequest filter, CancellationToken ct = default);
    Task<LeadDto> CreateWhatsAppClickAsync(Guid tenantId, WhatsAppClickRequest request, CancellationToken ct = default);
    Task<LeadDto> CreateFollowUpAsync(Guid tenantId, FollowUpRequest request, CancellationToken ct = default);
    Task UpdateStatusAsync(Guid tenantId, Guid id, UpdateLeadStatusRequest request, CancellationToken ct = default);
    Task<string> GetFollowUpLinkAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<byte[]> ExportAsync(Guid tenantId, LeadFilterRequest filter, CancellationToken ct = default);
}

public interface IInvoiceService
{
    Task<PagedResult<InvoiceDto>> GetAllAsync(Guid tenantId, InvoiceFilterRequest filter, CancellationToken ct = default);
    Task<InvoiceDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<InvoiceDto> CreateAsync(Guid tenantId, CreateInvoiceRequest request, Guid userId, CancellationToken ct = default);
    Task<InvoiceDto> RefundAsync(Guid tenantId, Guid invoiceId, RefundInvoiceRequest request, Guid userId, CancellationToken ct = default);
}

public interface IExpenseService
{
    Task<List<ExpenseCategoryDto>> GetCategoriesAsync(Guid tenantId, CancellationToken ct = default);
    Task<ExpenseCategoryDto> CreateCategoryAsync(Guid tenantId, CreateExpenseCategoryRequest request, CancellationToken ct = default);
    Task<ExpenseCategoryDto> UpdateCategoryAsync(Guid tenantId, Guid id, UpdateExpenseCategoryRequest request, CancellationToken ct = default);
    Task DeleteCategoryAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<PagedResult<ExpenseDto>> GetAllAsync(Guid tenantId, ExpenseFilterRequest filter, CancellationToken ct = default);
    Task<ExpenseDto> CreateAsync(Guid tenantId, CreateExpenseRequest request, Guid userId, CancellationToken ct = default);
    Task<ExpenseDto> UpdateAsync(Guid tenantId, Guid id, UpdateExpenseRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
}

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetAllAsync(Guid tenantId, CancellationToken ct = default);
    Task<EmployeeDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<EmployeeDto> CreateAsync(Guid tenantId, CreateEmployeeRequest request, CancellationToken ct = default);
    Task<EmployeeDto> UpdateAsync(Guid tenantId, Guid id, UpdateEmployeeRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task UpdatePermissionsAsync(Guid tenantId, Guid employeeId, UpdatePermissionsRequest request, CancellationToken ct = default);
    Task<int> GenerateSalaryExpensesAsync(Guid tenantId, string month, Guid userId, CancellationToken ct = default);
}

public interface IStoreSettingsService
{
    Task<StoreSettingsDto> GetAsync(Guid tenantId, CancellationToken ct = default);
    Task<PublicSettingsDto> GetPublicAsync(Guid tenantId, CancellationToken ct = default);
    Task<StoreSettingsDto> UpdateAsync(Guid tenantId, StoreSettingsDto request, CancellationToken ct = default);
    Task UpdateThemeAsync(Guid tenantId, UpdateThemeRequest request, CancellationToken ct = default);
    Task UpdateFooterAsync(Guid tenantId, UpdateFooterRequest request, CancellationToken ct = default);
    Task UpdateWhatsAppTemplatesAsync(Guid tenantId, UpdateWhatsAppTemplatesRequest request, CancellationToken ct = default);
    Task UpdatePwaAsync(Guid tenantId, UpdatePwaRequest request, CancellationToken ct = default);
}

public interface IReportService
{
    Task<DashboardDto> GetDashboardAsync(Guid tenantId, DashboardFilterRequest filter, CancellationToken ct = default);
}

public interface IPlatformService
{
    Task<List<TenantDto>> GetTenantsAsync(CancellationToken ct = default);
    Task<TenantDto> GetTenantAsync(Guid id, CancellationToken ct = default);
    Task<TenantDto> CreateTenantAsync(CreateTenantRequest request, CancellationToken ct = default);
    Task<TenantDto> UpdateTenantAsync(Guid id, UpdateTenantRequest request, CancellationToken ct = default);
    Task DeleteTenantAsync(Guid id, CancellationToken ct = default);
    Task SuspendTenantAsync(Guid id, CancellationToken ct = default);
    Task ActivateTenantAsync(Guid id, CancellationToken ct = default);
    Task<List<PlanDto>> GetPlansAsync(CancellationToken ct = default);
    Task<PlanDto> CreatePlanAsync(CreatePlanRequest request, CancellationToken ct = default);
    Task<PlanDto> UpdatePlanAsync(Guid id, UpdatePlanRequest request, CancellationToken ct = default);
    Task DeletePlanAsync(Guid id, CancellationToken ct = default);
    Task StartTrialAsync(Guid tenantId, StartTrialRequest request, CancellationToken ct = default);
    Task ActivateSubscriptionAsync(Guid tenantId, ActivateSubscriptionRequest request, CancellationToken ct = default);
    Task RenewSubscriptionAsync(Guid tenantId, RenewSubscriptionRequest request, CancellationToken ct = default);
    Task<List<SubscriptionSummaryDto>> GetExpiringSubscriptionsAsync(int days, CancellationToken ct = default);
    Task<FeatureToggleDto> GetFeaturesAsync(Guid tenantId, CancellationToken ct = default);
    Task UpdateFeaturesAsync(Guid tenantId, UpdateFeatureToggleRequest request, CancellationToken ct = default);
    Task<PlatformDashboardDto> GetDashboardAsync(string range, CancellationToken ct = default);
}
