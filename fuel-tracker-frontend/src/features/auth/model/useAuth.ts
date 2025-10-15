import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { useAuthStore, useVehicleStore, useUserSettingsStore } from '@/app/stores';
import { ROUTES } from '@/shared/lib/constants';
import type { SignUpDto, SignInDto } from '../api/authApi';

/**
 * Hook for authentication management
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout: logoutStore } = useAuthStore();
  const { setSettings } = useUserSettingsStore();
  const vehicleStore = useVehicleStore();

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: (credentials: SignUpDto) => authApi.signUp(credentials),
    onSuccess: (user) => {
      login(user);
      // Sync user settings
      setSettings({
        display_name: user.display_name,
        preferred_currency: user.preferred_currency,
        preferred_distance_unit: user.preferred_distance_unit,
        preferred_volume_unit: user.preferred_volume_unit,
        timezone: user.timezone,
        price_precision: user.price_precision,
      });
      toast.success('Account created successfully!');
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account');
    },
  });

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: (credentials: SignInDto) => authApi.signIn(credentials),
    onSuccess: (user) => {
      login(user);
      // Sync user settings
      setSettings({
        display_name: user.display_name,
        preferred_currency: user.preferred_currency,
        preferred_distance_unit: user.preferred_distance_unit,
        preferred_volume_unit: user.preferred_volume_unit,
        timezone: user.timezone,
        price_precision: user.price_precision,
      });
      toast.success('Welcome back!');
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid credentials');
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      // Clear all stores
      logoutStore();
      vehicleStore.setVehicles([]);
      vehicleStore.setSelectedVehicleId(null);
      toast.success('Logged out successfully');
      navigate(ROUTES.AUTH, { replace: true });
    },
    onError: (error: Error) => {
      // Even if request failed, clear local state
      logoutStore();
      vehicleStore.setVehicles([]);
      vehicleStore.setSelectedVehicleId(null);
      toast.error(error.message || 'Failed to logout');
      navigate(ROUTES.AUTH, { replace: true });
    },
  });

  return {
    signUp: signUpMutation.mutate,
    signIn: signInMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  };
};

