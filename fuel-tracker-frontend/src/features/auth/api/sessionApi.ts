import { apiClient } from '@/shared/api';
import type { User } from '@/entities/user';

/**
 * API for working with session
 */
export const sessionApi = {
  /**
   * Get CSRF token from server
   * Django will automatically set csrftoken cookie
   */
  fetchCsrfToken: async (): Promise<void> => {
    // GET request to get CSRF cookie
    // Django will automatically set csrftoken cookie in response
    await apiClient.get('/auth/signin');
  },

  /**
   * Check current session and get user data
   */
  checksession: async (): Promise<User | null> => {
    try {
      const { data } = await apiClient.get<User>('/users/me');
      return data;
    } catch (error) {
      // 401 or other error - session is invalid
      return null;
    }
  },
};
