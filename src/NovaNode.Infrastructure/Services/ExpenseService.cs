using Microsoft.EntityFrameworkCore;
using NovaNode.Application.DTOs.Common;
using NovaNode.Application.DTOs.Expenses;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Entities;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly AppDbContext _db;
    public ExpenseService(AppDbContext db) => _db = db;

    public async Task<List<ExpenseCategoryDto>> GetCategoriesAsync(Guid tenantId, CancellationToken ct = default) =>
        await _db.ExpenseCategories.Where(ec => ec.TenantId == tenantId)
            .Select(ec => new ExpenseCategoryDto { Id = ec.Id, Name = ec.Name, IsActive = ec.IsActive }).ToListAsync(ct);

    public async Task<ExpenseCategoryDto> CreateCategoryAsync(Guid tenantId, CreateExpenseCategoryRequest request, CancellationToken ct = default)
    {
        var ec = new ExpenseCategory { TenantId = tenantId, Name = request.Name };
        _db.ExpenseCategories.Add(ec);
        await _db.SaveChangesAsync(ct);
        return new ExpenseCategoryDto { Id = ec.Id, Name = ec.Name, IsActive = ec.IsActive };
    }

    public async Task<ExpenseCategoryDto> UpdateCategoryAsync(Guid tenantId, Guid id, UpdateExpenseCategoryRequest request, CancellationToken ct = default)
    {
        var ec = await _db.ExpenseCategories.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("ExpenseCategory not found.");
        ec.Name = request.Name; ec.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        return new ExpenseCategoryDto { Id = ec.Id, Name = ec.Name, IsActive = ec.IsActive };
    }

    public async Task DeleteCategoryAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var ec = await _db.ExpenseCategories.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Id == id, ct)
            ?? throw new KeyNotFoundException("ExpenseCategory not found.");
        _db.ExpenseCategories.Remove(ec);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<ExpenseDto>> GetAllAsync(Guid tenantId, ExpenseFilterRequest filter, CancellationToken ct = default)
    {
        var query = _db.Expenses.Include(e => e.Category).Where(e => e.TenantId == tenantId);
        if (filter.CategoryId.HasValue) query = query.Where(e => e.CategoryId == filter.CategoryId.Value);
        if (filter.From.HasValue) query = query.Where(e => e.OccurredAt >= filter.From.Value);
        if (filter.To.HasValue) query = query.Where(e => e.OccurredAt <= filter.To.Value);
        if (!string.IsNullOrEmpty(filter.Search)) query = query.Where(e => e.Title.Contains(filter.Search));

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(e => e.OccurredAt)
            .Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize)
            .Select(e => new ExpenseDto
            {
                Id = e.Id, CategoryId = e.CategoryId, CategoryName = e.Category.Name,
                Title = e.Title, Amount = e.Amount, OccurredAt = e.OccurredAt,
                Notes = e.Notes, CreatedAt = e.CreatedAt
            }).ToListAsync(ct);

        return new PagedResult<ExpenseDto> { Items = items, TotalCount = total, Page = filter.Page, PageSize = filter.PageSize };
    }

    public async Task<ExpenseDto> CreateAsync(Guid tenantId, CreateExpenseRequest request, Guid userId, CancellationToken ct = default)
    {
        var expense = new Expense
        {
            TenantId = tenantId, CategoryId = request.CategoryId, Title = request.Title,
            Amount = request.Amount, OccurredAt = request.OccurredAt, Notes = request.Notes,
            CreatedByUserId = userId
        };
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync(ct);
        return new ExpenseDto
        {
            Id = expense.Id, CategoryId = expense.CategoryId, Title = expense.Title,
            Amount = expense.Amount, OccurredAt = expense.OccurredAt, Notes = expense.Notes,
            CreatedAt = expense.CreatedAt
        };
    }

    public async Task<ExpenseDto> UpdateAsync(Guid tenantId, Guid id, UpdateExpenseRequest request, CancellationToken ct = default)
    {
        var expense = await _db.Expenses.Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == id, ct)
            ?? throw new KeyNotFoundException("Expense not found.");
        expense.CategoryId = request.CategoryId; expense.Title = request.Title;
        expense.Amount = request.Amount; expense.OccurredAt = request.OccurredAt; expense.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);
        return new ExpenseDto
        {
            Id = expense.Id, CategoryId = expense.CategoryId, CategoryName = expense.Category?.Name,
            Title = expense.Title, Amount = expense.Amount, OccurredAt = expense.OccurredAt,
            Notes = expense.Notes, CreatedAt = expense.CreatedAt
        };
    }

    public async Task DeleteAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        var expense = await _db.Expenses.FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == id, ct)
            ?? throw new KeyNotFoundException("Expense not found.");
        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync(ct);
    }
}
