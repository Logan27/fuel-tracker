import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '@/entities/user';
import { useUserSettingsStore } from '@/app/stores';
import type { UpdateUserSettingsDto } from '@/entities/user';

/**
 * Hook for working with user settings
 */
export const useUserSettings = () => {
  const { setSettings, setLoading } = useUserSettingsStore();

  // Query for getting user settings
  const settingsQuery = useQuery({
    queryKey: ['user', 'settings'],
    queryFn: async () => {
      const user = await userApi.getMe();
      // Sync with local store
      setSettings({
        preferred_currency: user.preferred_currency,
        preferred_distance_unit: user.preferred_distance_unit,
        preferred_volume_unit: user.preferred_volume_unit,
        timezone: user.timezone,
      });
      return user;
    },
  });

  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: UpdateUserSettingsDto) => userApi.updateMe(settings),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (user) => {
      // Sync with local store
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

