import { ReactNode, useEffect } from 'react';
import { useAuthStore, useUserSettingsStore } from '@/app/stores';
import { userApi } from '@/entities/user';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider проверяет сессию при загрузке приложения
 * и синхронизирует состояние аутентификации
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setUser, setLoading } = useAuthStore();
  const { setSettings } = useUserSettingsStore();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const user = await userApi.getMe();
        setUser(user);
        // Всегда синхронизируем настройки пользователя из БД
        // Это гарантирует, что изменения настроек всегда отражаются
        setSettings({
          display_name: user.display_name,
          preferred_currency: user.preferred_currency,
          preferred_distance_unit: user.preferred_distance_unit,
          preferred_volume_unit: user.preferred_volume_unit,
          timezone: user.timezone,
          price_precision: user.price_precision,
        });
      } catch (error) {
        // Если сессия невалидна, очищаем состояние
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []); // Запускаем только при монтировании

  return <>{children}</>;
};

