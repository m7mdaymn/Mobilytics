using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaNode.Domain.Entities;
using NovaNode.Domain.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Api.Controllers;

[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;

    public NotificationsController(AppDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    /// <summary>List notifications (newest first, max 50)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? unreadOnly, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var query = _db.Notifications.AsNoTracking()
            .Where(n => n.TenantId == tenantId);

        if (unreadOnly == true)
            query = query.Where(n => !n.IsRead);

        var list = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new
            {
                n.Id, n.Type, n.Title, n.Message,
                n.ActionUrl, n.IsRead, n.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    /// <summary>Get unread count</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var count = await _db.Notifications
            .CountAsync(n => n.TenantId == tenantId && !n.IsRead, ct);
        return Ok(new { count });
    }

    /// <summary>Mark one as read</summary>
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var n = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.TenantId == tenantId, ct);
        if (n == null) return NotFound("Notification not found.");
        n.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return Ok(true);
    }

    /// <summary>Mark all as read</summary>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _db.Notifications
            .Where(n => n.TenantId == tenantId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        return Ok(true);
    }

    /// <summary>Delete a notification</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var n = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.TenantId == tenantId, ct);
        if (n == null) return NotFound("Notification not found.");
        _db.Notifications.Remove(n);
        await _db.SaveChangesAsync(ct);
        return Ok(true);
    }
}
