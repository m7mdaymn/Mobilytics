using Microsoft.AspNetCore.Hosting;
using NovaNode.Domain.Interfaces;

namespace NovaNode.Infrastructure.Services;

public class LocalFileStorage : IFileStorage
{
    private readonly string _webRootPath;
    private static readonly HashSet<string> AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public LocalFileStorage(IWebHostEnvironment env)
    {
        _webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    }

    public async Task<string> SaveFileAsync(Guid tenantId, string entity, Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        if (!AllowedContentTypes.Contains(contentType.ToLowerInvariant()))
            throw new InvalidOperationException($"Content type '{contentType}' is not allowed. Allowed: jpg, png, webp.");

        if (fileStream.Length > MaxFileSize)
            throw new InvalidOperationException($"File size exceeds maximum allowed size of {MaxFileSize / 1024 / 1024}MB.");

        // Prevent path traversal
        var safeEntity = Path.GetFileName(entity);
        var extension = Path.GetExtension(fileName)?.ToLowerInvariant() ?? ".jpg";
        var safeFileName = $"{Guid.NewGuid()}{extension}";

        var relativePath = Path.Combine("uploads", tenantId.ToString(), safeEntity, safeFileName).Replace("\\", "/");
        var absolutePath = Path.Combine(_webRootPath, relativePath);

        var directory = Path.GetDirectoryName(absolutePath)!;
        Directory.CreateDirectory(directory);

        using var fs = new FileStream(absolutePath, FileMode.Create);
        await fileStream.CopyToAsync(fs, ct);

        return "/" + relativePath;
    }

    public Task DeleteFileAsync(string relativePath, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(relativePath)) return Task.CompletedTask;

        // Prevent path traversal
        var safePath = relativePath.TrimStart('/');
        if (safePath.Contains("..")) throw new InvalidOperationException("Invalid path.");

        var absolutePath = Path.Combine(_webRootPath, safePath);
        if (File.Exists(absolutePath))
            File.Delete(absolutePath);

        return Task.CompletedTask;
    }

    public string GetAbsolutePath(string relativePath)
    {
        return Path.Combine(_webRootPath, relativePath.TrimStart('/'));
    }
}
