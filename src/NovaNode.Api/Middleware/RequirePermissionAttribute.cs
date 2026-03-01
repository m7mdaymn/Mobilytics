using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace NovaNode.Api.Middleware;

/// <summary>
/// Enforces that the authenticated user has at least one of the specified permissions.
/// Owners (role = "Owner") bypass permission checks.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _permissions;

    public RequirePermissionAttribute(params string[] permissions)
    {
        _permissions = permissions;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Owners bypass permission checks
        var role = user.FindFirst("role")?.Value
            ?? user.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (role == "Owner")
            return;

        // Check if user has any of the required permissions
        var userPermissions = user.FindAll("permission").Select(c => c.Value).ToHashSet();
        if (_permissions.Any(p => userPermissions.Contains(p)))
            return;

        context.Result = new ObjectResult(new { error = "Insufficient permissions." })
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }
}
