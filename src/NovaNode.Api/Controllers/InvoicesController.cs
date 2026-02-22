using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Invoices;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _svc;
    private readonly ITenantContext _tenantContext;

    public InvoicesController(IInvoiceService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst("userId")?.Value ?? throw new UnauthorizedAccessException());

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
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var userId = GetUserId();
        return Created(await _svc.CreateAsync(tenantId, request, userId, ct));
    }

    [HttpPost("{id:guid}/refund")]
    public async Task<IActionResult> Refund(Guid id, [FromBody] RefundInvoiceRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var userId = GetUserId();
        return Ok(await _svc.RefundAsync(tenantId, id, request, userId, ct));
    }
}
