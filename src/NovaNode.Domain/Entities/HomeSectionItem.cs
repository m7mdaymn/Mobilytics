using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Item within a home section.
/// </summary>
public class HomeSectionItem : BaseEntity
{
    public Guid HomeSectionId { get; set; }
    public HomeSectionTargetType TargetType { get; set; }
    public Guid? TargetId { get; set; }
    public string? Title { get; set; }
    public string? ImageUrl { get; set; }
    public string? Url { get; set; }
    public string? Html { get; set; }
    public int DisplayOrder { get; set; }

    // Navigation
    public HomeSection HomeSection { get; set; } = null!;
}
