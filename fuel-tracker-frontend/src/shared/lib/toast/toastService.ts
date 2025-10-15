import { toast as sonnerToast } from 'sonner';
import { ERROR_MESSAGES } from '../errors/errorMessages';
import type { ApiError } from '../errors/errorHandler';
import type { ToastType, ToastOptions } from './toastTypes';

// Centralized toast service using Sonner
export class ToastService {
  private static instance: ToastService;
  private toastQueue: Array<{ id: string; type: ToastType; options: ToastOptions }> = [];

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  // Success toast
  success(message: string, options?: ToastOptions): void {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  // Error toast
  error(message: string, options?: ToastOptions): void {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  // Warning toast
  warning(message: string, options?: ToastOptions): void {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  // Info toast
  info(message: string, options?: ToastOptions): void {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  // Handle API errors with appropriate toast
  handleApiError(error: ApiError, context?: string): void {
    const title = context ? `${context} failed` : 'Operation failed';
    
    if (error.status === 401) {
      this.error(ERROR_MESSAGES.AUTH_session_EXPIRED, {
        title: 'session Expired',
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth',
        },
      });
    } else if (error.status === 403) {
      this.error(ERROR_MESSAGES.AUTH_FORBIDDEN, {
        title: 'Access Denied',
      });
    } else if (error.status === 404) {
      this.error(ERROR_MESSAGES.NOT_FOUND, {
        title: 'Not Found',
      });
    } else if (error.status === 409) {
      this.error(ERROR_MESSAGES.ALREADY_EXISTS, {
        title: 'Already Exists',
      });
    } else if (error.status && error.status >= 500) {
      this.error(ERROR_MESSAGES.SERVER_ERROR, {
        title: 'Server Error',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      });
    } else if (error.code === 'NETWORK_ERROR') {
      this.error(ERROR_MESSAGES.NETWORK_ERROR, {
        title: 'Connection Error',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      });
    } else {
      this.error(error.message, {
        title,
      });
    }
  }

  // Handle form validation errors
  handleValidationError(errors: Record<string, string[]>): void {
    const errorCount = Object.keys(errors).length;
    const firstError = Object.values(errors)[0]?.[0];
    
    this.error(
      errorCount === 1 
        ? firstError 
        : `Please fix ${errorCount} validation errors`,
      {
        title: 'Validation Error',
      }
    );
  }

  // Loading toast with promise
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  }

  // Dismiss all toasts
  dismissAll(): void {
    sonnerToast.dismiss();
  }
}

// Export singleton instance
export const toast = ToastService.getInstance();

// Convenience functions
export const showSuccess = (message: string, options?: ToastOptions) => 
  toast.success(message, options);

export const showError = (message: string, options?: ToastOptions) => 
  toast.error(message, options);

export const showWarning = (message: string, options?: ToastOptions) => 
  toast.warning(message, options);

export const showInfo = (message: string, options?: ToastOptions) => 
  toast.info(message, options);

export const handleApiError = (error: ApiError, context?: string) => 
  toast.handleApiError(error, context);

export const handleValidationError = (errors: Record<string, string[]>) => 
  toast.handleValidationError(errors);
