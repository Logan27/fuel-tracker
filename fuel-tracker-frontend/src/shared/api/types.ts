export interface ApiError {
  status: string;
  code: string;
  detail: string;
}

import type { AxiosError } from 'axios';

/**
 * Standard API error response from backend
 */
export interface ApiErrorResponse {
  errors: {
    status: string;
    code: string;
    detail: string;
  }[];
}

/**
 * Parsed error structure for client-side use
 */
export interface ParsedApiError {
  message: string;
  code?: string;
}

/**
 * Custom Axios error type with parsed error details
 */
export type AppAxiosError = AxiosError<ApiErrorResponse> & {
  parsedError?: ParsedApiError;
};


export interface ApiResponse<T = unknown> {
  data: T;
}

export interface PaginatedResponse<T> {
  count?: number; // PageNumberPagination returns count
  next: string | null;
  previous: string | null;
  results: T[];
}
