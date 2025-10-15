import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vehicleApi } from '@/entities/vehicle';
import { useVehicleStore } from '@/app/stores';
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '@/entities/vehicle';

/**
 * Hook for working with vehicles
 */
export const useVehicles = () => {
  const queryClient = useQueryClient();
  const vehicleStore = useVehicleStore();

  // Query for getting vehicles list
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const vehicles = await vehicleApi.getAll();
      // Sync with local store
      vehicleStore.setVehicles(vehicles);
      return vehicles;
    },
  });

  // Mutation for creating vehicle
  const createVehicleMutation = useMutation({
    mutationFn: (vehicle: CreateVehicleDto) => vehicleApi.create(vehicle),
    onSuccess: (newVehicle) => {
      // Add to store
      vehicleStore.addVehicle(newVehicle);
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vehicle');
    },
  });

  // Mutation for updating vehicle
  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVehicleDto }) =>
      vehicleApi.update(id, data),
    onSuccess: (updatedVehicle) => {
      // Update in store
      vehicleStore.updateVehicle(updatedVehicle.id, updatedVehicle);
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vehicle');
    },
  });

  // Mutation for deleting vehicle
  const deleteVehicleMutation = useMutation({
    mutationFn: (id: number) => vehicleApi.delete(id),
    onSuccess: (_, id) => {
      // Delete from store
      vehicleStore.removeVehicle(id);
      // Invalidate cache
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

