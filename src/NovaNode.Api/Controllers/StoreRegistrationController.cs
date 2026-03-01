using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.Interfaces;

namespace NovaNode.Api.Controllers;

[Route("api/v{version:apiVersion}/stores")]
public class StoreRegistrationController : BaseApiController
{
    private readonly IStoreRegistrationService _storeRegistrationService;
    private readonly IAuthService _authService;

    public StoreRegistrationController(IStoreRegistrationService storeRegistrationService, IAuthService authService)
    {
        _storeRegistrationService = storeRegistrationService;
        _authService = authService;
    }

    /// <summary>
    /// Unified login for all tenants (no slug needed)
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> UnifiedLogin([FromBody] LoginRequest request)
    {
        try
        {
            var result = await _authService.UnifiedLoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Register a new store (public endpoint)
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterStore(CreateStoreRegistrationDto dto)
    {
        var result = await _storeRegistrationService.CreateRegistrationAsync(dto);
        return Created(result);
    }

    /// <summary>
    /// Get a specific store registration
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetRegistration(Guid id)
    {
        var result = await _storeRegistrationService.GetRegistrationAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Get all pending store registrations (Admin only)
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetPendingRegistrations()
    {
        var result = await _storeRegistrationService.GetPendingRegistrationsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Get all store registrations with pagination (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetAllRegistrations(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _storeRegistrationService.GetAllRegistrationsAsync(pageNumber, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Approve a store registration (Admin only)
    /// </summary>
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ApproveRegistration(Guid id, [FromBody] ApproveStoreRegistrationDto dto)
    {
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? throw new UnauthorizedAccessException());
        var result = await _storeRegistrationService.ApproveRegistrationAsync(id, dto.ApprovalNotes, userId);
        return Ok(result);
    }

    /// <summary>
    /// Reject a store registration (Admin only)
    /// </summary>
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> RejectRegistration(
        Guid id,
        [FromBody] ApproveStoreRegistrationDto dto)
    {
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? throw new UnauthorizedAccessException());
        var result = await _storeRegistrationService.RejectRegistrationAsync(id, dto.RejectionReason ?? "No reason provided", userId);
        return Ok(result);
    }

    /// <summary>
    /// Put a store registration on hold (Admin only)
    /// </summary>
    [HttpPost("{id}/hold")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> HoldRegistration(
        Guid id,
        [FromBody] ApproveStoreRegistrationDto dto)
    {
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? throw new UnauthorizedAccessException());
        var result = await _storeRegistrationService.HoldRegistrationAsync(id, dto.ApprovalNotes, userId);
        return Ok(result);
    }
}
