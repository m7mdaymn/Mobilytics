/** Standard API envelope returned by the backend */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors: Record<string, string[]> | null;
}

/** Paginated list wrapper */
export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** Generic query params for paginated list endpoints */
export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/** API error thrown by the interceptor */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public override readonly message: string,
    public readonly errors: Record<string, string[]> | null = null,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get fieldErrors(): Record<string, string[]> {
    return this.errors ?? {};
  }

  getFieldError(field: string): string | null {
    const errs = this.errors?.[field];
    return errs?.length ? errs[0] : null;
  }
}
