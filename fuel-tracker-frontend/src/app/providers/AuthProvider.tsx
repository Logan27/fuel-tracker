import { ReactNode, useEffect } from 'react';
import { useAuthStore, useUserSettingsStore } from '@/app/stores';
import { userApi } from '@/entities/user';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider checks session on app load
 * and synchronizes authentication state
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setUser, setLoading } = useAuthStore();
  const { setSettings } = useUserSettingsStore();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        // Only check session if sessionid cookie exists
        // This avoids making unnecessary API calls and showing errors for unauthenticated users
        const hasSessionCookie = document.cookie.includes('sessionid=');

        if (!hasSessionCookie) {
          setUser(null);
          setLoading(false);
          return;
        }

        const user = await userApi.getMe();
        setUser(user);
        // Always sync user settings from DB
        // This ensures settings changes are always reflected
        setSettings({
          display_name: user.display_name,
          preferred_currency: user.preferred_currency,
          preferred_distance_unit: user.preferred_distance_unit,
          preferred_volume_unit: user.preferred_volume_unit,
          timezone: user.timezone,
          price_precision: user.price_precision,
        });
      } catch (error) {
        // If session is invalid, clear state
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []); // Run only on mount

  return <>{children}</>;
};

