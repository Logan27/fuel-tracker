/**
 * Утилиты для обработки ошибок API
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
 * Извлекает понятное сообщение об ошибке из ответа API
 */
export const getErrorMessage = (error: any): string => {
  // Если это уже строка
  if (typeof error === 'string') {
    return error;
  }

  // Если есть response с данными
  if (error.response?.data) {
    const data: ApiErrorResponse = error.response.data;
    
    // Если есть массив ошибок
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (firstError.field) {
        return `${firstError.field}: ${firstError.detail}`;
      }
      return firstError.detail;
    }
    
    // Если есть detail
    if (data.detail) {
      return data.detail;
    }
    
    // Если есть message
    if (data.message) {
      return data.message;
    }
  }

  // Если есть статус код
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

  // Если есть message
  if (error.message) {
    return error.message;
  }

  // Если есть code
  if (error.code) {
    return `Error: ${error.code}`;
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Извлекает ошибки валидации полей из ответа API
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
 * Проверяет, является ли ошибка ошибкой валидации
 */
export const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 || error.response?.status === 422;
};

/**
 * Проверяет, является ли ошибка ошибкой аутентификации
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Проверяет, является ли ошибка ошибкой сети
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.code === 'NETWORK_ERROR';
};

