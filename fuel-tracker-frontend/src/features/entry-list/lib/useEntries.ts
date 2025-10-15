import { useInfiniteQuery } from '@tanstack/react-query';
import { fuelEntryApi } from '@/entities/fuel-entry';
import type { FuelEntryFilters } from '@/entities/fuel-entry';

/**
 * Hook for loading fuel entries list with pagination (cursor-based)
 */
export const useEntries = (filters?: FuelEntryFilters) => {
  return useInfiniteQuery({
    queryKey: ['fuel-entries', filters],
    queryFn: ({ pageParam }) =>
      fuelEntryApi.getAll({
        ...filters,
        cursor: pageParam,
      }),
    getnextPageParam: (lastPage) => {
      // Extract cursor from next URL
      if (!lastPage.next) return undefined;
      try {
        const url = new URL(lastPage.next);
        return url.searchParams.get('cursor');
      } catch {
        return undefined;
      }
    },
    getpreviousPageParam: (firstPage) => {
      // Extract cursor from previous URL
      if (!firstPage.previous) return undefined;
      try {
        const url = new URL(firstPage.previous);
        return url.searchParams.get('cursor');
      } catch {
        return undefined;
      }
    },
    initialPageParam: undefined as string | undefined,
  });
};

