import { useQuery } from '@tanstack/react-query';
import { statisticsApi, type StatisticsFilters } from '@/entities/statistics';

export const useBrandStatistics = (filters?: StatisticsFilters) => {
  return useQuery({
    queryKey: ['brand-statistics', filters],
    queryFn: () => statisticsApi.getByBrand(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

