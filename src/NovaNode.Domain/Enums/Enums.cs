namespace NovaNode.Domain.Enums;

public enum SubscriptionStatus
{
    Trial = 0,
    Active = 1,
    Grace = 2,
    Expired = 3,
    Suspended = 4
}

public enum ItemCondition
{
    New = 0,
    Used = 1,
    Refurbished = 2
}

public enum ItemStatus
{
    Available = 0,
    Reserved = 1,
    Sold = 2,
    Hidden = 3
}

public enum TaxStatus
{
    Taxable = 0,
    Exempt = 1
}

public enum HomeSectionType
{
    BannerSlider = 0,
    FeaturedItems = 1,
    NewArrivals = 2,
    CategoriesShowcase = 3,
    BrandsCarousel = 4,
    Testimonials = 5,
    CustomHtml = 6
}

public enum HomeSectionTargetType
{
    Item = 0,
    Category = 1,
    Brand = 2,
    Url = 3,
    Html = 4
}

public enum LeadSource
{
    WhatsAppClick = 0,
    FollowUpRequest = 1,
    Inquiry = 2
}

public enum LeadStatus
{
    New = 0,
    Interested = 1,
    NoResponse = 2,
    Sold = 3
}

public enum CustomFieldType
{
    Text = 0,
    Number = 1,
    Boolean = 2,
    Select = 3
}

public enum WarrantyType
{
    Manufacturer = 0,
    Store = 1,
    Extended = 2,
    None = 3
}

public enum PaymentMethod
{
    Cash = 0,
    Instapay = 1,
    BankTransfer = 2,
    Other = 3
}

public enum PaymentStatus
{
    Paid = 0,
    Unpaid = 1,
    Partial = 2
}

public enum RegistrationStatus
{
    PendingApproval = 0,
    Approved = 1,
    Rejected = 2,
    OnHold = 3
}
