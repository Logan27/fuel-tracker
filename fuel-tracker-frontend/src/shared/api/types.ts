export interface ApiError {
  status: string;
  code: string;
  detail: string;
}

export interface ApiErrorResponse {
  errors: ApiError[];
}

export interface ApiResponse<T = unknown> {
  data: T;
}

export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}
