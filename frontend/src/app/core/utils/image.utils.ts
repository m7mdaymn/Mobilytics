import { environment } from '../../../environments/environment';

/**
 * Resolves an image URL to a full absolute URL.
 * - If the URL starts with http/https, returns as-is.
 * - If the URL starts with /uploads, prepends the API base URL.
 * - If empty/null, returns a placeholder SVG data URI.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23e5e7eb" viewBox="0 0 24 24"%3E%3Cpath d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    return `${environment.apiBaseUrl}${url}`;
  }
  // Handle relative uploads path without leading slash
  if (url.startsWith('uploads/') || url.startsWith('uploads\\')) {
    return `${environment.apiBaseUrl}/${url}`;
  }
  return url;
}
