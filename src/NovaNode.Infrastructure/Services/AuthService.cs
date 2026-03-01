using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.DTOs.Employees;
using NovaNode.Application.Interfaces;
using NovaNode.Infrastructure.Persistence;

namespace NovaNode.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse> LoginAsync(Guid tenantId, LoginRequest request, CancellationToken ct = default)
    {
        var employee = await _db.Employees
            .Include(e => e.Permissions)
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Email == request.Email && e.IsActive, ct)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        var permissions = employee.Permissions.Where(p => p.IsEnabled).Select(p => p.Key).ToList();
        var token = GenerateJwt(employee.Id, employee.Name, employee.Email, employee.Role, tenantId, permissions);
        var refreshToken = GenerateRefreshToken();

        return new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = new EmployeeInfo
            {
                Id = employee.Id,
                Name = employee.Name,
                Email = employee.Email,
                Role = employee.Role,
                Permissions = permissions
            }
        };
    }

    public async Task<UnifiedLoginResponse> UnifiedLoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        // Find employee by email across ALL tenants (no tenant context needed)
        var employee = await _db.Employees
            .Include(e => e.Permissions)
            .FirstOrDefaultAsync(e => e.Email == request.Email && e.IsActive, ct)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        // Get the tenant info
        var tenant = await _db.Tenants
            .FirstOrDefaultAsync(t => t.Id == employee.TenantId, ct)
            ?? throw new UnauthorizedAccessException("Store not found.");

        var permissions = employee.Permissions.Where(p => p.IsEnabled).Select(p => p.Key).ToList();
        var token = GenerateJwt(employee.Id, employee.Name, employee.Email, employee.Role, employee.TenantId, permissions);
        var refreshToken = GenerateRefreshToken();

        return new UnifiedLoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            TenantSlug = tenant.Slug,
            TenantName = tenant.Name,
            TenantActive = tenant.IsActive,
            User = new EmployeeInfo
            {
                Id = employee.Id,
                Name = employee.Name,
                Email = employee.Email,
                Role = employee.Role,
                Permissions = permissions
            }
        };
    }

    public async Task<LoginResponse> RefreshTokenAsync(Guid tenantId, string refreshToken, CancellationToken ct = default)
    {
        // Simplified: in production, store refresh tokens in DB
        // For now, re-issue a token for the first active owner/manager
        throw new NotImplementedException("Refresh token validation requires stored tokens. Use login endpoint.");
    }

    public async Task ChangePasswordAsync(Guid tenantId, Guid userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var employee = await _db.Employees
            .FirstOrDefaultAsync(e => e.Id == userId && e.TenantId == tenantId && e.IsActive, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, employee.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");

        employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PlatformLoginResponse> PlatformLoginAsync(PlatformLoginRequest request, CancellationToken ct = default)
    {
        var user = await _db.PlatformUsers
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        var token = GeneratePlatformJwt(user.Id, user.Email, user.Role);

        return new PlatformLoginResponse
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(8)
        };
    }

    private string GenerateJwt(Guid userId, string name, string email, string role, Guid tenantId, List<string> permissions)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "NovaNodeDefaultDevKey123456789012"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, name),
            new(JwtRegisteredClaimNames.Email, email),
            new("role", role),
            new("tenantId", tenantId.ToString())
        };

        foreach (var perm in permissions)
            claims.Add(new Claim("permission", perm));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "NovaNode",
            audience: _config["Jwt:Audience"] ?? "NovaNode",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GeneratePlatformJwt(Guid userId, string email, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "NovaNodeDefaultDevKey123456789012"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "NovaNode",
            audience: _config["Jwt:Audience"] ?? "NovaNode",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}
