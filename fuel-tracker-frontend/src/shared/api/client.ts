import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/shared/config';
import type { ApiErrorResponse } from './types';
import { parseApiError } from '@/shared/lib/errors';

// Создаём axios instance с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Для отправки cookies (session)
});

// Helper function to normalize URL - remove trailing slash
const normalizeUrl = (url?: string): string => {
  if (!url) return '';
  // Remove trailing slash if present, but keep root '/'
  return url.length > 1 && url.endsWith('/') ? url.slice(0, -1) : url;
};

// Функция для получения CSRF токена из cookies
const getCsrfToken = (): string | null => {
  const name = 'csrftoken';
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
  return cookieValue || null;
};

// Request interceptor - добавляем CSRF токен к небезопасным методам
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase();
    
    // Добавляем CSRF токен для POST, PUT, PATCH, DELETE
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    // Normalize URLs - remove trailing slashes (Django REST Framework compatibility)
    if (config.baseURL) {
      config.baseURL = normalizeUrl(config.baseURL);
    }
    if (config.url) {
      config.url = normalizeUrl(config.url);
    }

    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('[API] Request:', {
        method: config.method,
        baseURL: config.baseURL,
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ошибок
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Parse error using centralized handler
    const parsedError = parseApiError(error);

    // Обработка 401 - перенаправление на /auth
    if (error.response?.status === 401) {
      // Не редиректим если уже на странице авторизации
      if (window.location.pathname !== '/auth') {
        // Clear auth state and redirect
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth';
      }
    }

    // Attach parsed error message to axios error
    error.message = parsedError.message;

    // Add parsed error details for debugging
    (error as any).parsedError = parsedError;

    return Promise.reject(error);
  }
);
