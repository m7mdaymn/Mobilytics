using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Bootstrap;
using NovaNode.Application.DTOs.Items;
using NovaNode.Application.DTOs.Leads;
using NovaNode.Application.DTOs.Navigation;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Api.Controllers;

public class PublicController : BaseApiController
{
    private readonly IStoreSettingsService _settings;
    private readonly IItemService _items;
    private readonly ILeadService _leads;
    private readonly IInstallmentService _installments;
    private readonly IBrandService _brands;
    private readonly ICategoryService _categories;
    private readonly IItemTypeService _itemTypes;
    private readonly ITenantContext _tenantContext;
    private readonly AppDbContext _db;

    public PublicController(
        IStoreSettingsService settings,
        IItemService items,
        ILeadService leads,
        IInstallmentService installments,
        IBrandService brands,
        ICategoryService categories,
        IItemTypeService itemTypes,
        ITenantContext tenantContext,
        AppDbContext db)
    {
        _settings = settings;
        _items = items;
        _leads = leads;
        _installments = installments;
        _brands = brands;
        _categories = categories;
        _itemTypes = itemTypes;
        _tenantContext = tenantContext;
        _db = db;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken ct)
    {
        var tenants = await _db.Tenants
            .Where(t => t.IsActive)
            .Include(t => t.StoreSettings)
            .OrderBy(t => t.Name)
            .Select(t => new
            {
                t.Id,
                t.Slug,
                t.Name,
                LogoUrl = t.StoreSettings != null ? t.StoreSettings.LogoUrl : null
            })
            .ToListAsync(ct);

        return Ok(tenants);
    }

    /// <summary>
    /// Public pricing endpoint — returns active plans for the landing page.
    /// </summary>
    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans(CancellationToken ct)
    {
        var plans = await _db.Plans
            .Where(p => p.IsActive)
            .OrderBy(p => p.PriceMonthly)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.PriceMonthly,
                p.ActivationFee,
                p.FeaturesJson
            })
            .ToListAsync(ct);

        return Ok(plans);
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _settings.GetPublicAsync(tenantId, ct));
    }

    /// <summary>
    /// Combined bootstrap endpoint — returns settings + navigation in a single call.
    /// Eliminates two separate HTTP round-trips on initial storefront load.
    /// </summary>
    [HttpGet("bootstrap")]
    public async Task<IActionResult> GetBootstrap(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;

        var settingsTask = _settings.GetPublicAsync(tenantId, ct);
        var navigationTask = BuildNavigationAsync(tenantId, ct);

        await Task.WhenAll(settingsTask, navigationTask);

        return Ok(new BootstrapDto
        {
            Settings = await settingsTask,
            Navigation = await navigationTask
        });
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetItems([FromQuery] ItemFilterRequest filter, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _items.GetAllAsync(tenantId, filter, ct));
    }

    [HttpGet("items/{slug}")]
    public async Task<IActionResult> GetItem(string slug, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _items.GetBySlugAsync(tenantId, slug, ct));
    }

    [HttpPost("whatsapp-click")]
    public async Task<IActionResult> WhatsAppClick([FromBody] WhatsAppClickRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var lead = await _leads.CreateWhatsAppClickAsync(tenantId, request, ct);
        return Created(lead);
    }

    [HttpPost("follow-up")]
    public async Task<IActionResult> FollowUp([FromBody] FollowUpRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var lead = await _leads.CreateFollowUpAsync(tenantId, request, ct);
        return Created(lead);
    }

    [HttpGet("follow-up-link/{id:guid}")]
    public async Task<IActionResult> GetFollowUpLink(Guid id, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var link = await _leads.GetFollowUpLinkAsync(tenantId, id, ct);
        return Ok(new { link });
    }

    [HttpGet("items/{itemId:guid}/installments")]
    public async Task<IActionResult> GetItemInstallments(Guid itemId, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _installments.GetItemInstallmentsAsync(tenantId, itemId, ct));
    }

    /// <summary>Resolve a slug (including old slugs) to the current tenant slug.</summary>
    [HttpGet("resolve-slug/{slug}")]
    public async Task<IActionResult> ResolveSlug(string slug, CancellationToken ct)
    {
        // Check current tenant
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive, ct);
        if (tenant != null) return Ok(new { slug = tenant.Slug, redirect = false });

        // Check slug history
        var history = await _db.TenantSlugHistories
            .Include(h => h.Tenant)
            .FirstOrDefaultAsync(h => h.OldSlug == slug, ct);
        if (history != null && history.Tenant.IsActive)
            return Ok(new { slug = history.Tenant.Slug, redirect = true });

        return NotFound("Store not found.");
    }

    /// <summary>Aggregated navigation: item types + categories + brands for mega menu.</summary>
    [HttpGet("navigation")]
    public async Task<IActionResult> GetNavigation(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await BuildNavigationAsync(tenantId, ct));
    }

    /// <summary>Shared navigation builder used by both /navigation and /bootstrap.</summary>
    private async Task<NavigationDto> BuildNavigationAsync(Guid tenantId, CancellationToken ct)
    {
        // Categories are now the primary navigation (replacing ItemTypes)
        var cats = await _db.Categories
            .Where(c => c.TenantId == tenantId && c.IsActive && c.IsVisibleInNav)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(ct);

        var brands = await _db.Brands
            .Where(b => b.TenantId == tenantId && b.IsActive && b.IsVisibleInNav)
            .OrderBy(b => b.DisplayOrder)
            .ToListAsync(ct);

        // Build category tree
        var categoryTree = cats.Where(c => c.ParentId == null).Select(c => new NavCategoryDto
        {
            Id = c.Id, Slug = c.Slug, Name = c.Name, ImageUrl = c.ImageUrl,
            Children = cats.Where(ch => ch.ParentId == c.Id)
                .Select(ch => new NavCategoryDto { Id = ch.Id, Slug = ch.Slug, Name = ch.Name, ImageUrl = ch.ImageUrl })
                .ToList()
        }).ToList();

        // Build brand list
        var brandList = brands.Select(b => new NavBrandDto { Id = b.Id, Slug = b.Slug, Name = b.Name, LogoUrl = b.LogoUrl }).ToList();

        // Backward-compat: also provide ItemTypes from categories (so old frontends keep working)
        var itemTypes = cats.Where(c => c.ParentId == null).Select(c => new NavItemTypeDto
        {
            Id = c.Id, Slug = c.Slug, Name = c.Name, DisplayOrder = c.DisplayOrder
        }).ToList();

        // CategoriesByType: map each top-level category slug to its children
        var categoriesByType = new Dictionary<string, List<NavCategoryDto>>();
        var featuredBrandsByType = new Dictionary<string, List<NavBrandDto>>();
        foreach (var topCat in cats.Where(c => c.ParentId == null))
        {
            categoriesByType[topCat.Slug] = cats.Where(ch => ch.ParentId == topCat.Id)
                .Select(ch => new NavCategoryDto { Id = ch.Id, Slug = ch.Slug, Name = ch.Name, ImageUrl = ch.ImageUrl })
                .ToList();

            var brandIds = await _db.Items
                .Where(i => i.TenantId == tenantId && i.CategoryId == topCat.Id && i.BrandId != null)
                .Select(i => i.BrandId!.Value).Distinct().Take(8).ToListAsync(ct);
            featuredBrandsByType[topCat.Slug] = brands
                .Where(b => brandIds.Contains(b.Id))
                .Select(b => new NavBrandDto { Id = b.Id, Slug = b.Slug, Name = b.Name, LogoUrl = b.LogoUrl })
                .ToList();
        }

        return new NavigationDto
        {
            ItemTypes = itemTypes,
            Categories = categoryTree,
            Brands = brandList,
            CategoriesByType = categoriesByType,
            FeaturedBrandsByType = featuredBrandsByType,
            Flags = new NavigationFlags { ShowLastPiece = await _db.Items.AnyAsync(i => i.TenantId == tenantId && i.Quantity == 1 && i.Status == Domain.Enums.ItemStatus.Available, ct) }
        };
    }

    /// <summary>Public brand listing.</summary>
    [HttpGet("brands")]
    public async Task<IActionResult> GetBrands(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var brands = await _db.Brands
            .Where(b => b.TenantId == tenantId && b.IsActive)
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new NavBrandDto { Id = b.Id, Slug = b.Slug, Name = b.Name, LogoUrl = b.LogoUrl })
            .ToListAsync(ct);
        return Ok(brands);
    }

    /// <summary>Public category tree.</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _categories.GetTreeAsync(tenantId, ct));
    }

    /// <summary>Public item types.</summary>
    [HttpGet("item-types")]
    public async Task<IActionResult> GetItemTypes(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _itemTypes.GetAllAsync(tenantId, ct));
    }

    /// <summary>Public installment providers.</summary>
    [HttpGet("installments/providers")]
    public async Task<IActionResult> GetInstallmentProviders(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _installments.GetProvidersAsync(tenantId, ct));
    }

    /// <summary>Best sellers based on invoice frequency.</summary>
    [HttpGet("items/best-sellers")]
    public async Task<IActionResult> GetBestSellers([FromQuery] int take = 8, CancellationToken ct = default)
    {
        if (!_tenantContext.IsResolved) return NotFound("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;

        var bestSellerIds = await _db.InvoiceItems
            .Where(ii => ii.Invoice!.TenantId == tenantId && ii.ItemId != null)
            .GroupBy(ii => ii.ItemId)
            .OrderByDescending(g => g.Sum(x => x.Quantity))
            .Take(take)
            .Select(g => g.Key)
            .ToListAsync(ct);

        if (bestSellerIds.Count == 0)
        {
            // Fallback: featured items
            return Ok(await _items.GetAllAsync(tenantId, new ItemFilterRequest { Featured = true, PageSize = take }, ct));
        }

        var items = await _db.Items
            .Include(i => i.Brand).Include(i => i.Category)
            .Where(i => i.TenantId == tenantId && bestSellerIds.Contains(i.Id) && i.Status == Domain.Enums.ItemStatus.Available)
            .ToListAsync(ct);

        // Keep best-seller order
        var ordered = bestSellerIds
            .Select(id => items.FirstOrDefault(i => i.Id == id))
            .Where(i => i != null)
            .Select(i => new ItemDto
            {
                Id = i!.Id, ItemTypeId = i.ItemTypeId, ItemTypeName = i.Category?.Name,
                BrandId = i.BrandId, BrandName = i.Brand?.Name,
                CategoryId = i.CategoryId, CategoryName = i.Category?.Name,
                Title = i.Title, Slug = i.Slug, Description = i.Description,
                Price = i.Price, OldPrice = i.OldPrice, Condition = i.Condition,
                MainImageUrl = i.MainImageUrl, IsFeatured = i.IsFeatured,
                InstallmentAvailable = i.InstallmentAvailable,
                Quantity = i.Quantity, Status = i.Status,
                Color = i.Color, Storage = i.Storage, RAM = i.RAM,
                CreatedAt = i.CreatedAt, UpdatedAt = i.UpdatedAt
            }).ToList();

        return Ok(ordered);
    }
}
