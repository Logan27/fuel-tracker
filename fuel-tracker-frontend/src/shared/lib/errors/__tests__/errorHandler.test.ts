import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseApiError,
  retryWithBackoff,
  isNetworkError,
  isServerError,
  isValidationError,
  DEFAULT_RETRY_CONFIG,
  ERROR_MESSAGES
} from '../errorHandler';
import { ApiError, RetryConfig } from '../errorHandler';

// Mock console methods
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseApiError', () => {
    it('should parse network error', () => {
      const error = new Error('Network Error');
      const result = parseApiError(error);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        retryable: true
      });
    });

    it('should parse Axios error with response', () => {
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Validation failed' }
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR',
        details: { message: 'Validation failed' },
        retryable: false
      });
    });

    it('should parse 401 error', () => {
      const axiosError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.UNAUTHORIZED,
        status: 401,
        code: 'UNAUTHORIZED',
        details: { message: 'Unauthorized' },
        retryable: false
      });
    });

    it('should parse 403 error', () => {
      const axiosError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.FORBIDDEN,
        status: 403,
        code: 'FORBIDDEN',
        details: { message: 'Forbidden' },
        retryable: false
      });
    });

    it('should parse 404 error', () => {
      const axiosError = {
        response: {
          status: 404,
          data: { message: 'Not found' }
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.NOT_FOUND,
        status: 404,
        code: 'NOT_FOUND',
        details: { message: 'Not found' },
        retryable: false
      });
    });

    it('should parse 500 error', () => {
      const axiosError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        details: { message: 'Internal server error' },
        retryable: true
      });
    });

    it('should parse 503 error', () => {
      const axiosError = {
        response: {
          status: 503,
          data: { message: 'Service unavailable' }
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
        details: { message: 'Service unavailable' },
        retryable: true,
        retryAfter: 30
      });
    });

    it('should parse unknown error', () => {
      const axiosError = {
        response: {
          status: 418,
          data: { message: 'I\'m a teapot' }
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.UNKNOWN_ERROR,
        status: 418,
        code: 'UNKNOWN_ERROR',
        details: { message: 'I\'m a teapot' },
        retryable: false
      });
    });

    it('should handle error without response data', () => {
      const axiosError = {
        response: {
          status: 400
        }
      };
      
      const result = parseApiError(axiosError);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.BAD_REQUEST,
        status: 400,
        code: 'BAD_REQUEST',
        details: undefined,
        retryable: false
      });
    });

    it('should handle non-Axios error', () => {
      const error = new Error('Some error');
      const result = parseApiError(error);
      
      expect(result).toEqual({
        message: ERROR_MESSAGES.UNKNOWN_ERROR,
        code: 'UNKNOWN_ERROR',
        retryable: false
      });
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 400 } });
      
      await expect(retryWithBackoff(mockFn)).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 500 } });
      
      await expect(retryWithBackoff(mockFn, { maxRetries: 2, retryDelay: 10 })).rejects.toThrow();
      expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should use custom retry condition', async () => {
      const mockFn = vi.fn().mockRejectedValue({ response: { status: 500 } });
      const retryCondition = vi.fn().mockReturnValue(false);
      
      await expect(retryWithBackoff(mockFn, { retryCondition })).rejects.toThrow();
      expect(retryCondition).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use retryAfter delay when available', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce({ 
          response: { 
            status: 503,
            data: { retry_after: 5 }
          } 
        })
        .mockResolvedValue('success');
      
      const start = Date.now();
      await retryWithBackoff(mockFn, { retryDelay: 10 });
      const duration = Date.now() - start;
      
      expect(duration).toBeGreaterThanOrEqual(5000); // 5 seconds
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue('success');
      
      const start = Date.now();
      await retryWithBackoff(mockFn, { retryDelay: 100 });
      const duration = Date.now() - start;
      
      // Should be at least 100ms (first retry) + 200ms (second retry) = 300ms
      expect(duration).toBeGreaterThanOrEqual(300);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error type helpers', () => {
    it('should identify network errors', () => {
      const networkError: ApiError = { message: 'Network Error', code: 'NETWORK_ERROR', retryable: true };
      const serverError: ApiError = { message: 'Server Error', status: 500, retryable: true };
      
      expect(isNetworkError(networkError)).toBe(true);
      expect(isNetworkError(serverError)).toBe(false);
    });

    it('should identify server errors', () => {
      const serverError: ApiError = { message: 'Server Error', status: 500, retryable: true };
      const clientError: ApiError = { message: 'Client Error', status: 400, retryable: false };
      
      expect(isServerError(serverError)).toBe(true);
      expect(isServerError(clientError)).toBe(false);
    });

    it('should identify validation errors', () => {
      const validationError: ApiError = { message: 'Validation Error', status: 400, code: 'VALIDATION_ERROR' };
      const otherError: ApiError = { message: 'Other Error', status: 500 };
      
      expect(isValidationError(validationError)).toBe(true);
      expect(isValidationError(otherError)).toBe(false);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RETRY_CONFIG).toEqual({
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: expect.any(Function)
      });
    });

    it('should have retry condition that checks retryable flag', () => {
      const retryableError: ApiError = { message: 'Error', retryable: true };
      const nonRetryableError: ApiError = { message: 'Error', retryable: false };
      
      expect(DEFAULT_RETRY_CONFIG.retryCondition!(retryableError)).toBe(true);
      expect(DEFAULT_RETRY_CONFIG.retryCondition!(nonRetryableError)).toBe(false);
    });
  });
});
