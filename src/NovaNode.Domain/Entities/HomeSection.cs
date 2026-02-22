using NovaNode.Domain.Common;
using NovaNode.Domain.Enums;

namespace NovaNode.Domain.Entities;

/// <summary>
/// Home page section.
/// </summary>
public class HomeSection : TenantEntity
{
    public string Title { get; set; } = string.Empty;
    public HomeSectionType SectionType { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }

    public ICollection<HomeSectionItem> Items { get; set; } = [];
}
