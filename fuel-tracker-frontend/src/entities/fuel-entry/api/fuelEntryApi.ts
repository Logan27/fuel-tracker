import { retryApiClient } from '@/shared/api';
import { showSuccess, handleApiError } from '@/shared/lib/toast/toastService';
import type {
  FuelEntry,
  CreateFuelEntryDto,
  UpdateFuelEntryDto,
  FuelEntryFilters,
  PaginatedFuelEntries,
} from '../model/types';

export const fuelEntryApi = {
  getAll: async (filters?: FuelEntryFilters): Promise<PaginatedFuelEntries> => {
    try {
      return await retryApiClient.get<PaginatedFuelEntries>('/fuel-entries', {
        params: filters,
      });
    } catch (error) {
      handleApiError(error, 'Loading fuel entries');
      throw error;
    }
  },

  getById: async (id: number): Promise<FuelEntry> => {
    try {
      return await retryApiClient.get<FuelEntry>(`/fuel-entries/${id}`);
    } catch (error) {
      handleApiError(error, 'Loading fuel entry');
      throw error;
    }
  },

  create: async (entry: CreateFuelEntryDto): Promise<FuelEntry> => {
    try {
      console.log('[fuelEntryApi.create] Input data:', entry);
      console.log('[fuelEntryApi.create] vehicle field:', entry.vehicle);
      const newEntry = await retryApiClient.post<FuelEntry>('/fuel-entries', entry);
      showSuccess('Fuel entry added successfully!');
      return newEntry;
    } catch (error) {
      handleApiError(error, 'Creating fuel entry');
      throw error;
    }
  },

  update: async (id: number, entry: UpdateFuelEntryDto): Promise<FuelEntry> => {
    try {
      const updatedEntry = await retryApiClient.patch<FuelEntry>(`/fuel-entries/${id}`, entry);
      showSuccess('Fuel entry updated successfully!');
      return updatedEntry;
    } catch (error) {
      handleApiError(error, 'Updating fuel entry');
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await retryApiClient.delete(`/fuel-entries/${id}`);
      showSuccess('Fuel entry deleted successfully!');
    } catch (error) {
      handleApiError(error, 'Deleting fuel entry');
      throw error;
    }
  },
};
