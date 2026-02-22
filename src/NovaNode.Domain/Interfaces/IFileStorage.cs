namespace NovaNode.Domain.Interfaces;

/// <summary>
/// File storage abstraction.
/// </summary>
public interface IFileStorage
{
    Task<string> SaveFileAsync(Guid tenantId, string entity, Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
    Task DeleteFileAsync(string relativePath, CancellationToken ct = default);
    string GetAbsolutePath(string relativePath);
}
