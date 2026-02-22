using NovaNode.Domain.Enums;

namespace NovaNode.Application.DTOs.HomeSections;

public class HomeSectionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public HomeSectionType SectionType { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public List<HomeSectionItemDto> Items { get; set; } = [];
}

public class HomeSectionItemDto
{
    public Guid Id { get; set; }
    public HomeSectionTargetType TargetType { get; set; }
    public Guid? TargetId { get; set; }
    public string? Title { get; set; }
    public string? ImageUrl { get; set; }
    public string? Url { get; set; }
    public string? Html { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateHomeSectionRequest
{
    public string Title { get; set; } = string.Empty;
    public HomeSectionType SectionType { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public List<CreateHomeSectionItemRequest> Items { get; set; } = [];
}

public class CreateHomeSectionItemRequest
{
    public HomeSectionTargetType TargetType { get; set; }
    public Guid? TargetId { get; set; }
    public string? Title { get; set; }
    public string? ImageUrl { get; set; }
    public string? Url { get; set; }
    public string? Html { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateHomeSectionRequest
{
    public string Title { get; set; } = string.Empty;
    public HomeSectionType SectionType { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public List<CreateHomeSectionItemRequest> Items { get; set; } = [];
}
