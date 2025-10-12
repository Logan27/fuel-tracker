import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { showSuccess, showError, showWarning, handleApiError } from '../toastService';
import { parseApiError } from '../../errors/errorHandler';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock error handler
vi.mock('../../errors/errorHandler', () => ({
  parseApiError: vi.fn(),
}));

describe('Toast Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showSuccess', () => {
    it('should show success toast with message', () => {
      showSuccess('Operation completed successfully');
      
      expect(toast.success).toHaveBeenCalledWith('Operation completed successfully');
    });

    it('should show success toast with custom options', () => {
      const options = { duration: 5000 };
      showSuccess('Success message', options);
      
      expect(toast.success).toHaveBeenCalledWith('Success message', options);
    });
  });

  describe('showError', () => {
    it('should show error toast with message', () => {
      showError('Something went wrong');
      
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('should show error toast with custom options', () => {
      const options = { duration: 10000 };
      showError('Error message', options);
      
      expect(toast.error).toHaveBeenCalledWith('Error message', options);
    });
  });

  describe('showWarning', () => {
    it('should show warning toast with message', () => {
      showWarning('Please check your input');
      
      expect(toast.warning).toHaveBeenCalledWith('Please check your input');
    });

    it('should show warning toast with custom options', () => {
      const options = { duration: 3000 };
      showWarning('Warning message', options);
      
      expect(toast.warning).toHaveBeenCalledWith('Warning message', options);
    });
  });

  describe('handleApiError', () => {
    it('should handle network error', () => {
      const networkError = { message: 'Network Error', code: 'NETWORK_ERROR', retryable: true };
      vi.mocked(parseApiError).mockReturnValue(networkError);
      
      handleApiError(new Error('Network Error'));
      
      expect(parseApiError).toHaveBeenCalledWith(new Error('Network Error'));
      expect(toast.error).toHaveBeenCalledWith('Network Error');
    });

    it('should handle validation error', () => {
      const validationError = { 
        message: 'Validation failed', 
        status: 400, 
        code: 'VALIDATION_ERROR',
        retryable: false 
      };
      vi.mocked(parseApiError).mockReturnValue(validationError);
      
      handleApiError(new Error('Validation Error'));
      
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });

    it('should handle server error', () => {
      const serverError = { 
        message: 'Internal server error', 
        status: 500, 
        code: 'INTERNAL_SERVER_ERROR',
        retryable: true 
      };
      vi.mocked(parseApiError).mockReturnValue(serverError);
      
      handleApiError(new Error('Server Error'));
      
      expect(toast.error).toHaveBeenCalledWith('Internal server error');
    });

    it('should handle unauthorized error', () => {
      const unauthorizedError = { 
        message: 'Unauthorized', 
        status: 401, 
        code: 'UNAUTHORIZED',
        retryable: false 
      };
      vi.mocked(parseApiError).mockReturnValue(unauthorizedError);
      
      handleApiError(new Error('Unauthorized'));
      
      expect(toast.error).toHaveBeenCalledWith('Unauthorized');
    });

    it('should handle forbidden error', () => {
      const forbiddenError = { 
        message: 'Forbidden', 
        status: 403, 
        code: 'FORBIDDEN',
        retryable: false 
      };
      vi.mocked(parseApiError).mockReturnValue(forbiddenError);
      
      handleApiError(new Error('Forbidden'));
      
      expect(toast.error).toHaveBeenCalledWith('Forbidden');
    });

    it('should handle not found error', () => {
      const notFoundError = { 
        message: 'Not found', 
        status: 404, 
        code: 'NOT_FOUND',
        retryable: false 
      };
      vi.mocked(parseApiError).mockReturnValue(notFoundError);
      
      handleApiError(new Error('Not found'));
      
      expect(toast.error).toHaveBeenCalledWith('Not found');
    });

    it('should handle service unavailable error', () => {
      const serviceUnavailableError = { 
        message: 'Service unavailable', 
        status: 503, 
        code: 'SERVICE_UNAVAILABLE',
        retryable: true,
        retryAfter: 30
      };
      vi.mocked(parseApiError).mockReturnValue(serviceUnavailableError);
      
      handleApiError(new Error('Service unavailable'));
      
      expect(toast.error).toHaveBeenCalledWith('Service unavailable');
    });

    it('should handle unknown error', () => {
      const unknownError = { 
        message: 'Unknown error', 
        code: 'UNKNOWN_ERROR',
        retryable: false 
      };
      vi.mocked(parseApiError).mockReturnValue(unknownError);
      
      handleApiError(new Error('Unknown error'));
      
      expect(toast.error).toHaveBeenCalledWith('Unknown error');
    });

    it('should handle error with custom message', () => {
      const customError = { 
        message: 'Custom error message', 
        status: 400,
        retryable: false 
      };
      vi.mocked(parseApiError).mockReturnValue(customError);
      
      handleApiError(new Error('Custom error'));
      
      expect(toast.error).toHaveBeenCalledWith('Custom error message');
    });

    it('should handle error without message', () => {
      const errorWithoutMessage = { 
        message: '',
        retryable: false 
      };
      vi.mocked(parseApiError).mockReturnValue(errorWithoutMessage);
      
      handleApiError(new Error('Error without message'));
      
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });
});
