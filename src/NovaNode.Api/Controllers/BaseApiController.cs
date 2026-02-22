using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using NovaNode.Application.DTOs.Common;

namespace NovaNode.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult Ok<T>(T data) =>
        base.Ok(new ApiResponse<T> { Success = true, Data = data });

    protected IActionResult Created<T>(T data) =>
        StatusCode(201, new ApiResponse<T> { Success = true, Data = data });

    protected new IActionResult NoContent() =>
        StatusCode(204);

    protected IActionResult BadRequest(string message) =>
        StatusCode(400, new ApiResponse { Success = false, Message = message });

    protected IActionResult NotFound(string message) =>
        StatusCode(404, new ApiResponse { Success = false, Message = message });
}
