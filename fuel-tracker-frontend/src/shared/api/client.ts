import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/shared/config';
import type { ApiErrorResponse } from './types';
import { parseApiError } from '@/shared/lib/errors';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For sending cookies (session)
});

// Helper function to normalize URL - remove trailing slash
const normalizeUrl = (url?: string): string => {
  if (!url) return '';
  // Remove trailing slash if present, but keep root '/'
  return url.length > 1 && url.endsWith('/') ? url.slice(0, -1) : url;
};

// Function to get CSRF token from cookies
const getCsrfToken = (): string | null => {
  const name = 'csrftoken';
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
  return cookieValue || null;
};

// Request interceptor - add CSRF token to unsafe methods
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase();
    
    // Add CSRF token for POST, PUT, PATCH, DELETE
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

// Response interceptor - error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Parse error using centralized handler
    const parsedError = parseApiError(error);

    // Handle 401 - redirect to /auth
    if (error.response?.status === 401) {
      // Don't redirect if already on auth page
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
