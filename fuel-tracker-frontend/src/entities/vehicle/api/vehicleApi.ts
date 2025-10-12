import { retryApiClient, type PaginatedResponse } from '@/shared/api';
import { showSuccess, handleApiError } from '@/shared/lib/toast/toastService';
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '../model/types';

export const vehicleApi = {
  getAll: async (): Promise<Vehicle[]> => {
    try {
      const response = await retryApiClient.get<PaginatedResponse<Vehicle>>('/vehicles');
      // Backend возвращает пагинированный ответ, извлекаем массив
      return response.results;
    } catch (error) {
      handleApiError(error, 'Loading vehicles');
      throw error;
    }
  },

  getById: async (id: number): Promise<Vehicle> => {
    try {
      return await retryApiClient.get<Vehicle>(`/vehicles/${id}`);
    } catch (error) {
      handleApiError(error, 'Loading vehicle');
      throw error;
    }
  },

  create: async (vehicle: CreateVehicleDto): Promise<Vehicle> => {
    try {
      const newVehicle = await retryApiClient.post<Vehicle>('/vehicles', vehicle);
      showSuccess('Vehicle added successfully!');
      return newVehicle;
    } catch (error) {
      handleApiError(error, 'Creating vehicle');
      throw error;
    }
  },

  update: async (id: number, vehicle: UpdateVehicleDto): Promise<Vehicle> => {
    try {
      const updatedVehicle = await retryApiClient.patch<Vehicle>(`/vehicles/${id}`, vehicle);
      showSuccess('Vehicle updated successfully!');
      return updatedVehicle;
    } catch (error) {
      handleApiError(error, 'Updating vehicle');
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await retryApiClient.delete(`/vehicles/${id}`);
      showSuccess('Vehicle deleted successfully!');
    } catch (error) {
      handleApiError(error, 'Deleting vehicle');
      throw error;
    }
  },
};
