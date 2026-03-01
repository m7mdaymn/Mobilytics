using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;
using System.Security.Claims;

namespace NovaNode.Api.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _auth;
    private readonly ITenantContext _tenantContext;

    public AuthController(IAuthService auth, ITenantContext tenantContext)
    {
        _auth = auth;
        _tenantContext = tenantContext;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved)
            return BadRequest("Tenant not resolved. Make sure the store slug is correct and the X-Tenant-Slug header is provided.");
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _auth.LoginAsync(tenantId, request, ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved)
            return BadRequest("Tenant not resolved. Make sure the store slug is correct and the X-Tenant-Slug header is provided.");
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _auth.RefreshTokenAsync(tenantId, request.RefreshToken, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved)
            return BadRequest("Tenant not resolved.");
        var tenantId = _tenantContext.TenantId!.Value;
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());
        await _auth.ChangePasswordAsync(tenantId, userId, request, ct);
        return Ok(true);
    }
}
