/**
 * API error handling utilities
 */

export interface ApiError {
  status: number;
  code: string;
  detail: string;
  field?: string;
}

export interface ApiErrorResponse {
  errors?: ApiError[];
  detail?: string;
  message?: string;
}

/**
 * Extract clear error message from API response
 */
export const getErrorMessage = (error: any): string => {
  // If it's already a string
  if (typeof error === 'string') {
    return error;
  }

  // If there's response with data
  if (error.response?.data) {
    const data: ApiErrorResponse = error.response.data;
    
    // If there's error array
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (firstError.field) {
        return `${firstError.field}: ${firstError.detail}`;
      }
      return firstError.detail;
    }
    
    // If there's detail
    if (data.detail) {
      return data.detail;
    }
    
    // If there's message
    if (data.message) {
      return data.message;
    }
  }

  // If there's status code
  if (error.response?.status) {
    const status = error.response.status;
    switch (status) {
      case 400:
        return 'Invalid data provided. Please check your input.';
      case 401:
        return 'You are not authorized. Please sign in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists or conflicts with existing data.';
      case 422:
        return 'The data you provided is invalid. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Server error (${status}). Please try again.`;
    }
  }

  // If there's message
  if (error.message) {
    return error.message;
  }

  // If there is code
  if (error.code) {
    return `Error: ${error.code}`;
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extract field validation errors from API response
 */
export const getFieldErrors = (error: any): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    error.response.data.errors.forEach((err: ApiError) => {
      if (err.field) {
        fieldErrors[err.field] = err.detail;
      }
    });
  }
  
  return fieldErrors;
};

/**
 * Check if error is validation error
 */
export const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 || error.response?.status === 422;
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.code === 'NETWORK_ERROR';
};

