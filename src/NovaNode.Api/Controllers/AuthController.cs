using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.Interfaces;
using NovaNode.Domain.Interfaces;

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
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _auth.LoginAsync(tenantId, request, ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var tenantId = _tenantContext.TenantId!.Value;
        var result = await _auth.RefreshTokenAsync(tenantId, request.RefreshToken, ct);
        return Ok(result);
    }
}
