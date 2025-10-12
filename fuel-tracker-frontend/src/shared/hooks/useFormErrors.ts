import { useCallback } from 'react';
import { FieldErrors, FieldValues } from 'react-hook-form';
import { handleValidationError } from '../lib/toast';

interface UseFormErrorsOptions {
  showToast?: boolean;
  showInline?: boolean;
}

export const useFormErrors = <T extends FieldValues>(options: UseFormErrorsOptions = {}) => {
  const { showToast = true, showInline = true } = options;

  const handleFormErrors = useCallback((errors: FieldErrors<T>) => {
    // Convert react-hook-form errors to server validation format
    const serverErrors: Record<string, string[]> = {};
    
    Object.entries(errors).forEach(([field, error]) => {
      if (error?.message) {
        serverErrors[field] = [error.message];
      }
    });

    // Show toast notification if enabled
    if (showToast && Object.keys(serverErrors).length > 0) {
      handleValidationError(serverErrors);
    }

    return serverErrors;
  }, [showToast]);

  const handleServerErrors = useCallback((errors: Record<string, string[]>) => {
    // Show toast notification if enabled
    if (showToast) {
      handleValidationError(errors);
    }

    return errors;
  }, [showToast]);

  return {
    handleFormErrors,
    handleServerErrors,
  };
};
