using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Platform;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers.Platform;

[Authorize(Roles = "SuperAdmin")]
[Route("api/v1/platform/subscriptions")]
public class PlatformSubscriptionsController : BaseApiController
{
    private readonly IPlatformService _svc;
    public PlatformSubscriptionsController(IPlatformService svc) => _svc = svc;

    [HttpPost("{tenantId:guid}/trial")]
    public async Task<IActionResult> StartTrial(Guid tenantId, [FromBody] StartTrialRequest request, CancellationToken ct)
    {
        await _svc.StartTrialAsync(tenantId, request, ct);
        return Ok(new { message = "Trial started." });
    }

    [HttpPost("{tenantId:guid}/activate")]
    public async Task<IActionResult> Activate(Guid tenantId, [FromBody] ActivateSubscriptionRequest request, CancellationToken ct)
    {
        await _svc.ActivateSubscriptionAsync(tenantId, request, ct);
        return Ok(new { message = "Subscription activated." });
    }

    [HttpPost("{tenantId:guid}/renew")]
    public async Task<IActionResult> Renew(Guid tenantId, [FromBody] RenewSubscriptionRequest request, CancellationToken ct)
    {
        await _svc.RenewSubscriptionAsync(tenantId, request, ct);
        return Ok(new { message = "Subscription renewed." });
    }

    [HttpDelete("{tenantId:guid}")]
    public async Task<IActionResult> Delete(Guid tenantId, CancellationToken ct)
    {
        await _svc.DeleteSubscriptionAsync(tenantId, ct);
        return Ok(true);
    }

    [HttpPut("{tenantId:guid}")]
    public async Task<IActionResult> Update(Guid tenantId, [FromBody] UpdateSubscriptionRequest request, CancellationToken ct)
    {
        await _svc.UpdateSubscriptionAsync(tenantId, request, ct);
        return Ok(true);
    }

    [HttpGet("expiring")]
    public async Task<IActionResult> Expiring([FromQuery] int days = 7, CancellationToken ct = default) =>
        Ok(await _svc.GetExpiringSubscriptionsAsync(days, ct));
}
