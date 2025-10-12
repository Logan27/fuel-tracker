import { retryApiClient } from '@/shared/api';
import { handleApiError } from '@/shared/lib/toast/toastService';
import type { DashboardStats, StatisticsFilters, BrandStats, GradeStats } from '../model/types';

export const statisticsApi = {
  getDashboard: async (filters?: StatisticsFilters): Promise<DashboardStats> => {
    try {
      return await retryApiClient.get<DashboardStats>('/statistics/dashboard', {
        params: filters,
      });
    } catch (error) {
      handleApiError(error, 'Loading statistics');
      throw error;
    }
  },

  getByBrand: async (filters?: StatisticsFilters): Promise<BrandStats[]> => {
    try {
      return await retryApiClient.get<BrandStats[]>('/statistics/by-brand', {
        params: filters,
      });
    } catch (error) {
      handleApiError(error, 'Loading brand statistics');
      throw error;
    }
  },

  getByGrade: async (filters?: StatisticsFilters): Promise<GradeStats[]> => {
    try {
      return await retryApiClient.get<GradeStats[]>('/statistics/by-grade', {
        params: filters,
      });
    } catch (error) {
      handleApiError(error, 'Loading grade statistics');
      throw error;
    }
  },
};
