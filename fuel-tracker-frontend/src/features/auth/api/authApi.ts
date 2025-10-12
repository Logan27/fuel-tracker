import { retryApiClient } from '@/shared/api';
import { showSuccess, showError, handleApiError } from '@/shared/lib/toast/toastService';
import type { User } from '@/entities/user';

export interface SignUpDto {
  email: string;
  password: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
}

export const authApi = {
  signUp: async (credentials: SignUpDto): Promise<User> => {
    try {
      const user = await retryApiClient.post<User>('/auth/signup', credentials);
      showSuccess('Account created successfully!');
      return user;
    } catch (error) {
      handleApiError(error, 'Registration');
      throw error;
    }
  },

  signIn: async (credentials: SignInDto): Promise<User> => {
    try {
      const user = await retryApiClient.post<User>('/auth/signin', credentials);
      showSuccess('Welcome back!');
      return user;
    } catch (error) {
      handleApiError(error, 'Sign in');
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      await retryApiClient.post('/auth/signout');
      showSuccess('Signed out successfully');
    } catch (error) {
      handleApiError(error, 'Sign out');
      throw error;
    }
  },
};

