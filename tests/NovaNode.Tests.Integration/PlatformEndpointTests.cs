using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using NovaNode.Application.DTOs.Auth;
using NovaNode.Application.DTOs.Common;
using NovaNode.Application.DTOs.Platform;
using NovaNode.Domain.Enums;
using NovaNode.Infrastructure.Persistence;
using Xunit;

namespace NovaNode.Tests.Integration;

/// <summary>
/// Integration tests for platform (SuperAdmin) endpoints.
/// The DatabaseSeeder runs on startup and seeds the SuperAdmin user + default plan.
/// </summary>
public class PlatformEndpointTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public PlatformEndpointTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetPlatformTokenAsync()
    {
        var loginRequest = new PlatformLoginRequest
        {
            Email = "admin@novanode.com",
            Password = "Admin@123"
        };
        var response = await _client.PostAsJsonAsync("/api/v1/platform/auth/login", loginRequest);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        var envelope = JsonSerializer.Deserialize<ApiResponse<PlatformLoginResponse>>(body, JsonOpts);
        return envelope!.Data!.Token;
    }

    [Fact]
    public async Task PlatformLogin_ShouldReturnToken()
    {
        var loginRequest = new PlatformLoginRequest
        {
            Email = "admin@novanode.com",
            Password = "Admin@123"
        };
        var response = await _client.PostAsJsonAsync("/api/v1/platform/auth/login", loginRequest);
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Status={response.StatusCode} Body={body}");
        var envelope = JsonSerializer.Deserialize<ApiResponse<PlatformLoginResponse>>(body, JsonOpts);
        Assert.NotNull(envelope);
        Assert.True(envelope.Success);
        Assert.NotNull(envelope.Data);
        Assert.False(string.IsNullOrEmpty(envelope.Data.Token), $"Token is empty. Body={body}");
    }

    [Fact]
    public async Task PlatformLogin_InvalidCredentials_ShouldReturn401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/platform/auth/login",
            new PlatformLoginRequest { Email = "admin@novanode.com", Password = "WrongPassword" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetDashboard_ShouldReturnCounts()
    {
        var token = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/platform/dashboard");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        var envelope = JsonSerializer.Deserialize<ApiResponse<PlatformDashboardDto>>(body, JsonOpts);
        Assert.NotNull(envelope?.Data);
        Assert.True(envelope.Data.TotalTenants >= 0);
    }

    [Fact]
    public async Task CreateTenant_ShouldSucceed()
    {
        var token = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Get default plan
        var plansResp = await _client.GetAsync("/api/v1/platform/plans");
        plansResp.EnsureSuccessStatusCode();
        var plansBody = await plansResp.Content.ReadAsStringAsync();
        var plansEnvelope = JsonSerializer.Deserialize<ApiResponse<List<PlanDto>>>(plansBody, JsonOpts);
        Assert.NotNull(plansEnvelope?.Data);
        Assert.NotEmpty(plansEnvelope.Data);

        var request = new CreateTenantRequest
        {
            Name = "Test Shop",
            Slug = "test-shop-" + Guid.NewGuid().ToString()[..8],
            OwnerEmail = "owner@testshop.com",
            OwnerPassword = "Owner@123",
            OwnerName = "Shop Owner"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/platform/tenants", request);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        var tenantEnvelope = JsonSerializer.Deserialize<ApiResponse<TenantDto>>(body, JsonOpts);
        Assert.NotNull(tenantEnvelope?.Data);
        Assert.Equal(request.Name, tenantEnvelope.Data.Name);
        Assert.Equal("Pending", tenantEnvelope.Data.Status);
    }

    [Fact]
    public async Task GetPlans_ShouldReturnAtLeastOne()
    {
        var token = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/platform/plans");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        var envelope = JsonSerializer.Deserialize<ApiResponse<List<PlanDto>>>(body, JsonOpts);
        Assert.NotNull(envelope?.Data);
        Assert.NotEmpty(envelope.Data);
        Assert.Contains(envelope.Data, p => p.Name == "Standard");
    }

    [Fact]
    public async Task Unauthorized_GetDashboard_ShouldReturn401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/v1/platform/dashboard");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Onboarding ──────────────────────────────────────────────

    [Fact]
    public async Task OnboardTenant_ShouldCreateTenantWithInvoice()
    {
        var token = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Get plan
        var plansResp = await _client.GetAsync("/api/v1/platform/plans");
        plansResp.EnsureSuccessStatusCode();
        var plansList = JsonSerializer.Deserialize<ApiResponse<List<PlanDto>>>(
            await plansResp.Content.ReadAsStringAsync(), JsonOpts)!.Data!;
        var plan = plansList.First();

        var request = new OnboardTenantRequest
        {
            StoreName = "Onboard Test Store",
            Slug = "onboard-" + Guid.NewGuid().ToString()[..6],
            OwnerName = "Test Owner",
            OwnerEmail = "onboard@test.com",
            OwnerPassword = "Onboard@123",
            PlanId = plan.Id,
            DurationMonths = 3,
            IsTrial = false,
            ActivationFeePaid = plan.ActivationFee,
            SubscriptionAmountPaid = plan.PriceMonthly * 3,
            Discount = 0,
            PaymentMethod = PaymentMethod.Cash
        };

        var response = await _client.PostAsJsonAsync("/api/v1/platform/tenants/onboard", request);
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Status={response.StatusCode} Body={body}");

        var envelope = JsonSerializer.Deserialize<ApiResponse<OnboardTenantResponse>>(body, JsonOpts);
        Assert.NotNull(envelope?.Data);
        Assert.Equal("Active", envelope.Data.Tenant.Status);
        Assert.NotNull(envelope.Data.Tenant.Subscription);
        Assert.Equal("Active", envelope.Data.Tenant.Subscription!.Status);
        Assert.NotNull(envelope.Data.Invoice);
        Assert.True(envelope.Data.Invoice!.Total > 0);
    }

    [Fact]
    public async Task OnboardTenant_AsTrial_ShouldCreateTrialSubscription()
    {
        var token = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var plansList = JsonSerializer.Deserialize<ApiResponse<List<PlanDto>>>(
            await (await _client.GetAsync("/api/v1/platform/plans")).Content.ReadAsStringAsync(), JsonOpts)!.Data!;
        var plan = plansList.First();

        var request = new OnboardTenantRequest
        {
            StoreName = "Trial Store",
            Slug = "trial-" + Guid.NewGuid().ToString()[..6],
            OwnerName = "Trial Owner",
            OwnerEmail = "trial@test.com",
            OwnerPassword = "Trial@123",
            PlanId = plan.Id,
            DurationMonths = 1,
            IsTrial = true,
            ActivationFeePaid = 0,
            SubscriptionAmountPaid = 0,
            Discount = 0,
            PaymentMethod = PaymentMethod.Cash
        };

        var response = await _client.PostAsJsonAsync("/api/v1/platform/tenants/onboard", request);
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Status={response.StatusCode} Body={body}");

        var envelope = JsonSerializer.Deserialize<ApiResponse<OnboardTenantResponse>>(body, JsonOpts);
        Assert.NotNull(envelope?.Data);
        Assert.Equal("Trial", envelope.Data.Tenant.Subscription!.Status);
    }

    // ── Invoices ────────────────────────────────────────────────

    [Fact]
    public async Task GetInvoices_ShouldReturnList()
    {
        var token = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/platform/invoices");
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Status={response.StatusCode} Body={body}");

        var envelope = JsonSerializer.Deserialize<ApiResponse<List<PlatformInvoiceDto>>>(body, JsonOpts);
        Assert.NotNull(envelope?.Data);
    }

    // ── Store Requests ──────────────────────────────────────────

    [Fact]
    public async Task GetStoreRequests_ShouldReturnList()
    {
        var token = await GetPlatformTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/platform/store-requests");
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Status={response.StatusCode} Body={body}");

        var envelope = JsonSerializer.Deserialize<ApiResponse<List<object>>>(body, JsonOpts);
        Assert.NotNull(envelope?.Data);
    }
}
