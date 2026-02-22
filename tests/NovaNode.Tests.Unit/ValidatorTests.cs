using FluentValidation.TestHelper;
using NovaNode.Application.Validators;
using Xunit;

namespace NovaNode.Tests.Unit;

public class ValidatorTests
{
    [Fact]
    public void LoginValidator_ShouldFail_WhenEmailEmpty()
    {
        var validator = new LoginRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Auth.LoginRequest { Email = "", Password = "test" });
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void LoginValidator_ShouldFail_WhenPasswordEmpty()
    {
        var validator = new LoginRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Auth.LoginRequest { Email = "a@b.com", Password = "" });
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void LoginValidator_ShouldPass_WhenValid()
    {
        var validator = new LoginRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Auth.LoginRequest { Email = "a@b.com", Password = "test123" });
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateBrandValidator_ShouldFail_WhenNameEmpty()
    {
        var validator = new CreateBrandRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Brands.CreateBrandRequest { Name = "" });
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void CreateBrandValidator_ShouldPass_WhenNameProvided()
    {
        var validator = new CreateBrandRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Brands.CreateBrandRequest { Name = "Apple" });
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateCategoryValidator_ShouldFail_WhenNameEmpty()
    {
        var validator = new CreateCategoryRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Categories.CreateCategoryRequest { Name = "" });
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void CreateItemTypeValidator_ShouldFail_WhenNameEmpty()
    {
        var validator = new CreateItemTypeRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.ItemTypes.CreateItemTypeRequest { Name = "" });
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void CreateTenantValidator_ShouldFail_WhenSlugEmpty()
    {
        var validator = new CreateTenantRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Platform.CreateTenantRequest
        {
            Name = "Test",
            Slug = "",
            OwnerName = "Owner",
            OwnerEmail = "o@t.com",
            OwnerPassword = "pass123"
        });
        result.ShouldHaveValidationErrorFor(x => x.Slug);
    }

    [Fact]
    public void CreateTenantValidator_ShouldPass_WhenAllFieldsProvided()
    {
        var validator = new CreateTenantRequestValidator();
        var result = validator.TestValidate(new Application.DTOs.Platform.CreateTenantRequest
        {
            Name = "Test Store",
            Slug = "test-store",
            OwnerName = "Owner",
            OwnerEmail = "owner@test.com",
            OwnerPassword = "SecurePass123"
        });
        result.ShouldNotHaveAnyValidationErrors();
    }
}
