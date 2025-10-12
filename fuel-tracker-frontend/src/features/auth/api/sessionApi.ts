import { apiClient } from '@/shared/api';
import type { User } from '@/entities/user';

/**
 * API для работы с сессией
 */
export const sessionApi = {
  /**
   * Получить CSRF токен от сервера
   * Django автоматически установит cookie csrftoken
   */
  fetchCsrfToken: async (): Promise<void> => {
    // GET запрос для получения CSRF cookie
    // Django автоматически установит csrftoken cookie в ответе
    await apiClient.get('/auth/signin');
  },

  /**
   * Проверить текущую сессию и получить данные пользователя
   */
  checkSession: async (): Promise<User | null> => {
    try {
      const { data } = await apiClient.get<User>('/users/me');
      return data;
    } catch (error) {
      // 401 или другая ошибка - сессия невалидна
      return null;
    }
  },
};
