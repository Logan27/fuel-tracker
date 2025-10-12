import { AxiosError } from 'axios';
import { apiClient } from './client';
import { retryWithBackoff, parseApiError, type ApiError, type RetryConfig } from '../lib/errors';
import { handleApiError } from '../lib/toast/toastService';

// Enhanced API client with retry logic
export class RetryApiClient {
  private retryConfig: RetryConfig;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? 3,
      retryDelay: retryConfig?.retryDelay ?? 1000,
      retryCondition: retryConfig?.retryCondition,
    };
  }

  // GET request with retry
  async get<T>(url: string, config?: any): Promise<T> {
    return retryWithBackoff(
      () => apiClient.get<T>(url, config).then(response => response.data),
      this.retryConfig
    );
  }

  // POST request with retry
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return retryWithBackoff(
      () => apiClient.post<T>(url, data, config).then(response => response.data),
      this.retryConfig
    );
  }

  // PUT request with retry
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return retryWithBackoff(
      () => apiClient.put<T>(url, data, config).then(response => response.data),
      this.retryConfig
    );
  }

  // PATCH request with retry
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return retryWithBackoff(
      () => apiClient.patch<T>(url, data, config).then(response => response.data),
      this.retryConfig
    );
  }

  // DELETE request with retry
  async delete<T>(url: string, config?: any): Promise<T> {
    return retryWithBackoff(
      () => apiClient.delete<T>(url, config).then(response => response.data),
      this.retryConfig
    );
  }

  // Request with custom retry config
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    config?: any,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const finalRetryConfig = customRetryConfig 
      ? { ...this.retryConfig, ...customRetryConfig }
      : this.retryConfig;

    return retryWithBackoff(
      () => {
        switch (method) {
          case 'GET':
            return apiClient.get<T>(url, config).then(response => response.data);
          case 'POST':
            return apiClient.post<T>(url, data, config).then(response => response.data);
          case 'PUT':
            return apiClient.put<T>(url, data, config).then(response => response.data);
          case 'PATCH':
            return apiClient.patch<T>(url, data, config).then(response => response.data);
          case 'DELETE':
            return apiClient.delete<T>(url, config).then(response => response.data);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      finalRetryConfig
    );
  }

  // Request with error handling and toast notifications
  async requestWithErrorHandling<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    config?: any,
    context?: string
  ): Promise<T | null> {
    try {
      return await this.request<T>(method, url, data, config);
    } catch (error) {
      const apiError = parseApiError(error);
      handleApiError(apiError, context);
      return null;
    }
  }
}

// Export singleton instance
export const retryApiClient = new RetryApiClient();
