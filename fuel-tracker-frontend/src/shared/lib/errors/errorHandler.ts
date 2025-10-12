import { AxiosError } from 'axios';
import { ERROR_MESSAGES } from './errorMessages';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  retryable?: boolean;
  retryAfter?: number; // seconds
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  retryCondition?: (error: ApiError) => boolean;
}

export const parseApiError = (error: unknown): ApiError => {
  // Axios error
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    // Network error (no response)
    if (!error.response) {
      return {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return {
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        status,
        code: 'TIMEOUT_ERROR',
        retryable: true,
      };
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        return {
          message: responseData?.message || ERROR_MESSAGES.VALIDATION_ERROR,
          status,
          code: 'VALIDATION_ERROR',
          details: responseData,
          retryable: false,
        };

      case 401:
        return {
          message:
            responseData?.message || ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS,
          status,
          code: 'UNAUTHORIZED',
          details: responseData,
          retryable: false,
        };

      case 403:
        return {
          message: responseData?.message || ERROR_MESSAGES.AUTH_FORBIDDEN,
          status,
          code: 'FORBIDDEN',
          details: responseData,
          retryable: false,
        };

      case 404:
        return {
          message: responseData?.message || ERROR_MESSAGES.NOT_FOUND,
          status,
          code: 'NOT_FOUND',
          details: responseData,
          retryable: false,
        };

      case 409:
        return {
          message: responseData?.message || ERROR_MESSAGES.ALREADY_EXISTS,
          status,
          code: 'CONFLICT',
          details: responseData,
          retryable: false,
        };

      case 500:
        return {
          message: ERROR_MESSAGES.SERVER_ERROR,
          status,
          code: 'SERVER_ERROR',
          details: responseData,
          retryable: true,
        };

      case 503:
        return {
          message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
          status,
          code: 'SERVICE_UNAVAILABLE',
          details: responseData,
          retryable: true,
          retryAfter: 30, // 30 seconds
        };

      default:
        return {
          message: responseData?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
          status,
          code: 'UNKNOWN_ERROR',
          details: responseData,
        };
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      code: 'GENERIC_ERROR',
    };
  }

  // Unknown error type
  return {
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    code: 'UNKNOWN_ERROR',
    details: error,
  };
};

export const getErrorTitle = (error: ApiError): string => {
  if (error.status && error.status >= 500) {
    return 'Server Error';
  }
  if (error.status === 404) {
    return 'Not Found';
  }
  if (error.status === 403 || error.status === 401) {
    return 'Authentication Error';
  }
  if (error.status === 400) {
    return 'Validation Error';
  }
  return 'Error';
};

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryCondition: (error: ApiError) => error.retryable === true,
};

// Retry logic with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  let lastError: ApiError | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const apiError = parseApiError(error);
      lastError = apiError;
      
      // Don't retry if error is not retryable or max retries reached
      if (!apiError.retryable || attempt === config.maxRetries) {
        throw error;
      }
      
      // Check custom retry condition
      if (config.retryCondition && !config.retryCondition(apiError)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const baseDelay = apiError.retryAfter ? apiError.retryAfter * 1000 : config.retryDelay;
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Network error state helper
export const isNetworkError = (error: ApiError): boolean => {
  return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR';
};

// Server error state helper
export const isServerError = (error: ApiError): boolean => {
  return error.status ? error.status >= 500 : false;
};

// Validation error state helper
export const isValidationError = (error: ApiError): boolean => {
  return error.status === 400 || error.code === 'VALIDATION_ERROR';
};

