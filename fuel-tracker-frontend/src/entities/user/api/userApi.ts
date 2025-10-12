import { retryApiClient } from '@/shared/api';
import { showSuccess, handleApiError } from '@/shared/lib/toast/toastService';
import type { User, UpdateUserSettingsDto } from '../model/types';

export const userApi = {
  getMe: async (): Promise<User> => {
    try {
      return await retryApiClient.get<User>('/users/me');
    } catch (error) {
      handleApiError(error, 'Loading user profile');
      throw error;
    }
  },

  updateMe: async (settings: UpdateUserSettingsDto): Promise<User> => {
    try {
      const updatedUser = await retryApiClient.patch<User>('/users/me', settings);
      showSuccess('Settings updated successfully!');
      return updatedUser;
    } catch (error) {
      handleApiError(error, 'Updating settings');
      throw error;
    }
  },

  exportData: async (): Promise<Blob> => {
    try {
      const blob = await retryApiClient.get<Blob>('/users/me/export', {
        responseType: 'blob',
      });
      showSuccess('Data exported successfully!');
      return blob;
    } catch (error) {
      handleApiError(error, 'Exporting data');
      throw error;
    }
  },

  deleteAccount: async (): Promise<void> => {
    try {
      await retryApiClient.delete('/users/me');
      showSuccess('Account deleted successfully');
    } catch (error) {
      handleApiError(error, 'Deleting account');
      throw error;
    }
  },
};
