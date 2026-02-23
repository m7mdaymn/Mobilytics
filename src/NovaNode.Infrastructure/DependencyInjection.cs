using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;
using NovaNode.Infrastructure.Services;
using NovaNode.Infrastructure.MultiTenancy;

namespace NovaNode.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        services.AddInfrastructureServices();
        return services;
    }

    /// <summary>
    /// Registers infrastructure services WITHOUT DbContext.
    /// Used by integration tests that provide their own DbContext configuration.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<IFileStorage, LocalFileStorage>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IBrandService, BrandService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IItemTypeService, ItemTypeService>();
        services.AddScoped<ICustomFieldService, CustomFieldService>();
        services.AddScoped<IItemService, ItemService>();
        services.AddScoped<IHomeSectionService, HomeSectionService>();
        services.AddScoped<ILeadService, LeadService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IStoreSettingsService, StoreSettingsService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IPlatformService, PlatformService>();
        services.AddScoped<IStoreRegistrationService, StoreRegistrationService>();

        return services;
    }
}
