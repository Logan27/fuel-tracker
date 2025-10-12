import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { FuelEntryFilters } from '@/entities/fuel-entry';

export const useEntryFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo((): FuelEntryFilters => {
    const vehicle = searchParams.get('vehicle');
    const date_after = searchParams.get('date_after');
    const date_before = searchParams.get('date_before');
    const fuel_brand = searchParams.get('fuel_brand');
    const fuel_grade = searchParams.get('fuel_grade');
    const station_name = searchParams.get('station_name');
    const sort_by = searchParams.get('sort_by');
    const sort_order = searchParams.get('sort_order');

    return {
      vehicle: vehicle ? parseInt(vehicle) : undefined,
      date_after: date_after || undefined,
      date_before: date_before || undefined,
      fuel_brand: fuel_brand || undefined,
      fuel_grade: fuel_grade || undefined,
      station_name: station_name || undefined,
      sort_by: (sort_by as any) || 'entry_date',
      sort_order: (sort_order as 'asc' | 'desc') || 'desc',
    };
  }, [searchParams]);

  const updateFilters = useCallback((newFilters: FuelEntryFilters) => {
    const params = new URLSearchParams(searchParams);
    
    // Clear existing filter params
    const filterKeys = [
      'vehicle', 'date_after', 'date_before', 'fuel_brand', 
      'fuel_grade', 'station_name', 'sort_by', 'sort_order'
    ];
    filterKeys.forEach(key => params.delete(key));

    // Add new filter params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });

    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    const filterKeys = [
      'vehicle', 'date_after', 'date_before', 'fuel_brand', 
      'fuel_grade', 'station_name', 'sort_by', 'sort_order'
    ];
    filterKeys.forEach(key => params.delete(key));
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
};