using FluentValidation;
using NovaNode.Application.DTOs;

namespace NovaNode.Application.Validators;

public class CreateStoreRegistrationValidator : AbstractValidator<CreateStoreRegistrationDto>
{
    public CreateStoreRegistrationValidator()
    {
        RuleFor(x => x.StoreName)
            .NotEmpty().WithMessage("Store name is required.")
            .MaximumLength(100).WithMessage("Store name cannot exceed 100 characters.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Store category is required.");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Store location is required.")
            .MaximumLength(100).WithMessage("Location cannot exceed 100 characters.");

        RuleFor(x => x.OwnerName)
            .NotEmpty().WithMessage("Owner name is required.")
            .MaximumLength(100).WithMessage("Owner name cannot exceed 100 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Invalid phone number format.");

        RuleFor(x => x.NumberOfStores)
            .NotEmpty().WithMessage("Number of stores is required.");

        RuleFor(x => x.AgreeTerms)
            .Equal(true).WithMessage("You must agree to the terms and conditions.");
    }
}
