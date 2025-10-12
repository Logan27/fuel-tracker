import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vehicleApi } from '@/entities/vehicle';
import { useVehicleStore } from '@/app/stores';
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '@/entities/vehicle';

/**
 * Хук для работы с автомобилями
 */
export const useVehicles = () => {
  const queryClient = useQueryClient();
  const vehicleStore = useVehicleStore();

  // Query для получения списка автомобилей
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const vehicles = await vehicleApi.getAll();
      // Синхронизируем с локальным store
      vehicleStore.setVehicles(vehicles);
      return vehicles;
    },
  });

  // Mutation для создания автомобиля
  const createVehicleMutation = useMutation({
    mutationFn: (vehicle: CreateVehicleDto) => vehicleApi.create(vehicle),
    onSuccess: (newVehicle) => {
      // Добавляем в store
      vehicleStore.addVehicle(newVehicle);
      // Инвалидируем кэш
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vehicle');
    },
  });

  // Mutation для обновления автомобиля
  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVehicleDto }) =>
      vehicleApi.update(id, data),
    onSuccess: (updatedVehicle) => {
      // Обновляем в store
      vehicleStore.updateVehicle(updatedVehicle.id, updatedVehicle);
      // Инвалидируем кэш
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vehicle');
    },
  });

  // Mutation для удаления автомобиля
  const deleteVehicleMutation = useMutation({
    mutationFn: (id: number) => vehicleApi.delete(id),
    onSuccess: (_, id) => {
      // Удаляем из store
      vehicleStore.removeVehicle(id);
      // Инвалидируем кэш
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vehicle');
    },
  });

  return {
    vehicles: vehiclesQuery.data || [],
    isLoading: vehiclesQuery.isLoading,
    isError: vehiclesQuery.isError,
    error: vehiclesQuery.error,
    refetch: vehiclesQuery.refetch,

    createVehicle: (vehicle: CreateVehicleDto, options?: { onSuccess?: () => void }) => {
      createVehicleMutation.mutate(vehicle, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
      });
    },
    isCreating: createVehicleMutation.isPending,

    updateVehicle: ({ id, data }: { id: number; data: UpdateVehicleDto }, options?: { onSuccess?: () => void }) => {
      updateVehicleMutation.mutate({ id, data }, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
      });
    },
    isUpdating: updateVehicleMutation.isPending,

    deleteVehicle: (id: number, options?: { onSuccess?: () => void }) => {
      deleteVehicleMutation.mutate(id, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
      });
    },
    isDeleting: deleteVehicleMutation.isPending,
  };
};

