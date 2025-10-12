import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { UserSettings } from '@/entities/user';

interface UserSettingsState extends UserSettings {
  isLoading: boolean;
}

interface UserSettingsActions {
  setSettings: (settings: Partial<UserSettings>) => void;
  setCurrency: (currency: string) => void;
  setDistanceUnit: (unit: 'km' | 'mi') => void;
  setVolumeUnit: (unit: 'L' | 'gal') => void;
  setTimezone: (timezone: string) => void;
  setPricePrecision: (precision: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

type UserSettingsStore = UserSettingsState & UserSettingsActions;

const defaultSettings: UserSettings = {
  display_name: '',
  preferred_currency: 'USD',
  preferred_distance_unit: 'km',
  preferred_volume_unit: 'L',
  timezone: 'UTC',
  price_precision: 2,
};

export const useUserSettingsStore = create<UserSettingsStore>()(
  devtools(
    persist(
      (set) => ({
        // State
        ...defaultSettings,
        isLoading: false,

        // Actions
        setSettings: (settings) =>
          set((state) => ({
            ...state,
            ...settings,
          })),

        setCurrency: (currency) =>
          set({
            preferred_currency: currency,
          }),

        setDistanceUnit: (unit) =>
          set({
            preferred_distance_unit: unit,
          }),

        setVolumeUnit: (unit) =>
          set({
            preferred_volume_unit: unit,
          }),

        setTimezone: (timezone) =>
          set({
            timezone,
          }),

        setPricePrecision: (precision) =>
          set({
            price_precision: precision,
          }),

        setLoading: (loading) =>
          set({
            isLoading: loading,
          }),

        reset: () =>
          set({
            ...defaultSettings,
            isLoading: false,
          }),
      }),
      {
        name: 'user-settings-storage',
        partialize: (state) => ({
          display_name: state.display_name,
          preferred_currency: state.preferred_currency,
          preferred_distance_unit: state.preferred_distance_unit,
          preferred_volume_unit: state.preferred_volume_unit,
          timezone: state.timezone,
          price_precision: state.price_precision,
        }),
      }
    ),
    { name: 'UserSettingsStore' }
  )
);

