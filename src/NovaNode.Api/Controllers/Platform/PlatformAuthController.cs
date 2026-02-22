using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers.Platform;

[Route("api/v1/platform/auth")]
public class PlatformAuthController : BaseApiController
{
    private readonly IAuthService _auth;
    public PlatformAuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] PlatformLoginRequest request, CancellationToken ct)
    {
        var result = await _auth.PlatformLoginAsync(request, ct);
        return Ok(result);
    }
}
