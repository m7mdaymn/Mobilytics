namespace NovaNode.Application.DTOs.Navigation;

public class NavigationDto
{
    public List<NavItemTypeDto> ItemTypes { get; set; } = [];
    public List<NavCategoryDto> Categories { get; set; } = [];
    public Dictionary<string, List<NavCategoryDto>> CategoriesByType { get; set; } = [];
    public Dictionary<string, List<NavBrandDto>> FeaturedBrandsByType { get; set; } = [];
    public List<NavBrandDto> Brands { get; set; } = [];
    public NavigationFlags Flags { get; set; } = new();
}

public class NavItemTypeDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string? IconUrl { get; set; }
}

public class NavCategoryDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public List<NavCategoryDto> Children { get; set; } = [];
}

public class NavBrandDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
}

public class NavigationFlags
{
    public bool ShowLastPiece { get; set; }
}
