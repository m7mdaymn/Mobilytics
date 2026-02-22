using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.CustomFields;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Api.Controllers;

[Authorize]
public class CustomFieldsController : BaseApiController
{
    private readonly ICustomFieldService _svc;
    private readonly ITenantContext _tenantContext;

    public CustomFieldsController(ICustomFieldService svc, ITenantContext tenantContext)
    {
        _svc = svc;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? itemTypeId, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.GetAllAsync(tenantId, itemTypeId, ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomFieldRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Created(await _svc.CreateAsync(tenantId, request, ct));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomFieldRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        return Ok(await _svc.UpdateAsync(tenantId, id, request, ct));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        await _svc.DeleteAsync(tenantId, id, ct);
        return NoContent();
    }
}
