using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.DTOs.Brands;
using NovaNode.Application.DTOs.Common;
using NovaNode.Application.DTOs.Platform;
using Xunit;

namespace NovaNode.Tests.Integration;

/// <summary>
/// Integration tests for tenant-scoped endpoints: auth, brands CRUD, subscription enforcement.
/// </summary>
public class TenantFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public TenantFlowTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(string slug, string ownerEmail, string ownerPassword, string token)> CreateTenantAndLoginAsync()
    {
        // 1. Platform login
        var platformToken = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", platformToken);

        // 2. Get default plan
        var plansResp = await _client.GetAsync("/api/v1/platform/plans");
        plansResp.EnsureSuccessStatusCode();
        var plansEnvelope = JsonSerializer.Deserialize<ApiResponse<List<PlanDto>>>(
            await plansResp.Content.ReadAsStringAsync(), JsonOpts)!;

        // 3. Create tenant
        var slug = "integ-" + Guid.NewGuid().ToString()[..8];
        var ownerEmail = "owner@" + slug + ".com";
        var ownerPassword = "Owner@123";

        var createResp = await _client.PostAsJsonAsync("/api/v1/platform/tenants", new CreateTenantRequest
        {
            Name = "Integration Test Shop",
            Slug = slug,
            OwnerEmail = ownerEmail,
            OwnerPassword = ownerPassword,
            OwnerName = "Test Owner"
        });
        createResp.EnsureSuccessStatusCode();

        // 4. Tenant login
        _client.DefaultRequestHeaders.Authorization = null;
        _client.DefaultRequestHeaders.Add("X-Tenant-Slug", slug);

        var loginResp = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = ownerEmail, Password = ownerPassword });
        loginResp.EnsureSuccessStatusCode();
        var loginEnvelope = JsonSerializer.Deserialize<ApiResponse<LoginResponse>>(
            await loginResp.Content.ReadAsStringAsync(), JsonOpts)!;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginEnvelope.Data!.Token);

        return (slug, ownerEmail, ownerPassword, loginEnvelope.Data.Token);
    }

    private async Task<string> GetPlatformTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/platform/auth/login",
            new PlatformLoginRequest { Email = "admin@novanode.com", Password = "Admin@123" });
        response.EnsureSuccessStatusCode();
        var envelope = JsonSerializer.Deserialize<ApiResponse<PlatformLoginResponse>>(
            await response.Content.ReadAsStringAsync(), JsonOpts)!;
        return envelope.Data!.Token;
    }

    [Fact]
    public async Task TenantLogin_ShouldSucceed()
    {
        var (_, _, _, token) = await CreateTenantAndLoginAsync();
        Assert.False(string.IsNullOrEmpty(token));
    }

    [Fact]
    public async Task TenantLogin_WrongPassword_ShouldReturn401()
    {
        // Create tenant first
        var platformToken = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", platformToken);

        var plansResp = await _client.GetAsync("/api/v1/platform/plans");
        var plansEnvelope = JsonSerializer.Deserialize<ApiResponse<List<PlanDto>>>(
            await plansResp.Content.ReadAsStringAsync(), JsonOpts)!;

        var slug = "auth-fail-" + Guid.NewGuid().ToString()[..8];
        await _client.PostAsJsonAsync("/api/v1/platform/tenants", new CreateTenantRequest
        {
            Name = "Auth Fail Shop", Slug = slug, OwnerEmail = "fail@test.com",
            OwnerPassword = "Owner@123", OwnerName = "Owner"
        });

        _client.DefaultRequestHeaders.Authorization = null;
        _client.DefaultRequestHeaders.Remove("X-Tenant-Slug");
        _client.DefaultRequestHeaders.Add("X-Tenant-Slug", slug);

        var loginResp = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = "fail@test.com", Password = "WrongPassword!" });

        Assert.Equal(HttpStatusCode.Unauthorized, loginResp.StatusCode);
    }

    [Fact]
    public async Task BrandsCrud_ShouldWork()
    {
        var (slug, _, _, _) = await CreateTenantAndLoginAsync();

        // Create brand
        var createResp = await _client.PostAsJsonAsync("/api/v1/brands",
            new CreateBrandRequest { Name = "Apple", Slug = "apple" });
        createResp.EnsureSuccessStatusCode();
        var brandEnvelope = JsonSerializer.Deserialize<ApiResponse<BrandDto>>(
            await createResp.Content.ReadAsStringAsync(), JsonOpts)!;
        var brand = brandEnvelope.Data!;

        Assert.Equal("Apple", brand.Name);
        Assert.NotEqual(Guid.Empty, brand.Id);

        // Get all brands
        var listResp = await _client.GetAsync("/api/v1/brands");
        listResp.EnsureSuccessStatusCode();
        var brandsEnvelope = JsonSerializer.Deserialize<ApiResponse<List<BrandDto>>>(
            await listResp.Content.ReadAsStringAsync(), JsonOpts)!;
        Assert.Contains(brandsEnvelope.Data!, b => b.Name == "Apple");

        // Get by ID
        var getResp = await _client.GetAsync($"/api/v1/brands/{brand.Id}");
        getResp.EnsureSuccessStatusCode();

        // Update
        var updateResp = await _client.PutAsJsonAsync($"/api/v1/brands/{brand.Id}",
            new UpdateBrandRequest { Name = "Apple Inc.", Slug = "apple-inc" });
        updateResp.EnsureSuccessStatusCode();
        var updatedEnvelope = JsonSerializer.Deserialize<ApiResponse<BrandDto>>(
            await updateResp.Content.ReadAsStringAsync(), JsonOpts)!;
        Assert.Equal("Apple Inc.", updatedEnvelope.Data!.Name);

        // Delete
        var deleteResp = await _client.DeleteAsync($"/api/v1/brands/{brand.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        // Verify deleted
        var getAfterDelete = await _client.GetAsync($"/api/v1/brands/{brand.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);
    }

    [Fact]
    public async Task Unauthenticated_BrandsGet_ShouldReturn401()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Tenant-Slug", "some-slug");
        // No auth header
        var response = await client.GetAsync("/api/v1/brands");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MissingTenantSlug_ShouldReturn400WithMessage()
    {
        // No X-Tenant-Slug header — header-only resolution
        var client = _factory.CreateClient();
        // Request a tenant-scoped endpoint without tenant slug
        var response = await client.GetAsync("/api/v1/brands");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("X-Tenant-Slug", body);
    }

    [Fact]
    public async Task HealthEndpoint_ShouldBeExemptFromTenantResolution()
    {
        var client = _factory.CreateClient();
        // No X-Tenant-Slug header, no auth — health must still return 200
        var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("healthy", body);
    }

    private async Task<string> GetPlatformTokenAsyncWith(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/v1/platform/auth/login",
            new PlatformLoginRequest { Email = "admin@novanode.com", Password = "Admin@123" });
        response.EnsureSuccessStatusCode();
        var envelope = JsonSerializer.Deserialize<ApiResponse<PlatformLoginResponse>>(
            await response.Content.ReadAsStringAsync(), JsonOpts)!;
        return envelope.Data!.Token;
    }
}
