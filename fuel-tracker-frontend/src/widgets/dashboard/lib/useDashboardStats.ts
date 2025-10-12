import { useQuery } from '@tanstack/react-query';
import { statisticsApi, type StatisticsFilters } from '@/entities/statistics';
import { format } from 'date-fns';

export const useDashboardStats = (filters?: StatisticsFilters) => {
  return useQuery({
    queryKey: ['dashboard-stats', filters],
    queryFn: async () => {
      // Transform date range if provided
      const apiFilters: StatisticsFilters = {
        ...filters,
        date_after: filters?.date_after
          ? format(new Date(filters.date_after), 'yyyy-MM-dd')
          : undefined,
        date_before: filters?.date_before
          ? format(new Date(filters.date_before), 'yyyy-MM-dd')
          : undefined,
      };

      return statisticsApi.getDashboard(apiFilters);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

