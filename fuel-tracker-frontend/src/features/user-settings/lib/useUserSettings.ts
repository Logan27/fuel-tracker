import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '@/entities/user';
import { useUserSettingsStore } from '@/app/stores';
import type { UpdateUserSettingsDto } from '@/entities/user';

/**
 * Хук для работы с настройками пользователя
 */
export const useUserSettings = () => {
  const { setSettings, setLoading } = useUserSettingsStore();

  // Query для получения настроек пользователя
  const settingsQuery = useQuery({
    queryKey: ['user', 'settings'],
    queryFn: async () => {
      const user = await userApi.getMe();
      // Синхронизируем с локальным store
      setSettings({
        preferred_currency: user.preferred_currency,
        preferred_distance_unit: user.preferred_distance_unit,
        preferred_volume_unit: user.preferred_volume_unit,
        timezone: user.timezone,
      });
      return user;
    },
  });

  // Mutation для обновления настроек
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: UpdateUserSettingsDto) => userApi.updateMe(settings),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (user) => {
      // Синхронизируем с локальным store
      setSettings({
        preferred_currency: user.preferred_currency,
        preferred_distance_unit: user.preferred_distance_unit,
        preferred_volume_unit: user.preferred_volume_unit,
        timezone: user.timezone,
      });
      toast.success('Settings updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    refetch: settingsQuery.refetch,
  };
};

