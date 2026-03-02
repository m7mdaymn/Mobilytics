using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Api.Middleware;
using NovaNode.Application.DTOs.Invoices;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _svc;
    private readonly ITenantContext _tenantContext;
    private readonly IAuditService _audit;

    public InvoicesController(IInvoiceService svc, ITenantContext tenantContext, IAuditService audit)
    {
        _svc = svc;
        _tenantContext = tenantContext;
        _audit = audit;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] InvoiceFilterRequest filter, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAllAsync(tenantId, filter, ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetByIdAsync(tenantId, id, ct));
    }

    [HttpPost]
    [RequirePermission("invoices.create")]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var userId = GetUserId();
        var result = await _svc.CreateAsync(tenantId, request, userId, ct);
        await _audit.LogAsync(tenantId, userId, "Created", "Invoice", result.Id.ToString(), null, result.InvoiceNumber, ct);
        return Created(result);
    }

    [HttpPost("{id:guid}/refund")]
    [RequirePermission("invoices.refund")]
    public async Task<IActionResult> Refund(Guid id, [FromBody] RefundInvoiceRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var userId = GetUserId();
        var result = await _svc.RefundAsync(tenantId, id, request, userId, ct);
        await _audit.LogAsync(tenantId, userId, "Refunded", "Invoice", id.ToString(), null, result.InvoiceNumber, ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission("invoices.delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var userId = GetUserId();
        await _svc.DeleteAsync(tenantId, id, ct);
        await _audit.LogAsync(tenantId, userId, "Deleted", "Invoice", id.ToString(), null, null, ct);
        return NoContent();
    }
}
