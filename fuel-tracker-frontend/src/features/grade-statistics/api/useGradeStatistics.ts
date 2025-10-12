import { useQuery } from '@tanstack/react-query';
import { statisticsApi, type StatisticsFilters } from '@/entities/statistics';

export const useGradeStatistics = (filters?: StatisticsFilters) => {
  return useQuery({
    queryKey: ['grade-statistics', filters],
    queryFn: () => statisticsApi.getByGrade(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

