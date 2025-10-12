import { useInfiniteQuery } from '@tanstack/react-query';
import { fuelEntryApi } from '@/entities/fuel-entry';
import type { FuelEntryFilters } from '@/entities/fuel-entry';

/**
 * Хук для загрузки списка fuel entries с пагинацией (cursor-based)
 */
export const useEntries = (filters?: FuelEntryFilters) => {
  return useInfiniteQuery({
    queryKey: ['fuel-entries', filters],
    queryFn: ({ pageParam }) =>
      fuelEntryApi.getAll({
        ...filters,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      // Извлекаем cursor из URL next
      if (!lastPage.next) return undefined;
      try {
        const url = new URL(lastPage.next);
        return url.searchParams.get('cursor');
      } catch {
        return undefined;
      }
    },
    getPreviousPageParam: (firstPage) => {
      // Извлекаем cursor из URL previous
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

