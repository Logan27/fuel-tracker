import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Vehicle } from '@/entities/vehicle';

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicleId: number | null;
  isLoading: boolean;
}

interface VehicleActions {
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: number, vehicle: Partial<Vehicle>) => void;
  removeVehicle: (id: number) => void;
  setSelectedVehicleId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  getSelectedVehicle: () => Vehicle | null;
}

type VehicleStore = VehicleState & VehicleActions;

export const useVehicleStore = create<VehicleStore>()(
  devtools(
    (set, get) => ({
      // State
      vehicles: [],
      selectedVehicleId: null,
      isLoading: false,

      // Actions
      setVehicles: (vehicles) =>
        set({
          vehicles,
          // Keep current selection (null = All Vehicles)
        }),

      addVehicle: (vehicle) =>
        set((state) => ({
          vehicles: [...state.vehicles, vehicle],
          // Keep current selection
        })),

      updateVehicle: (id, updatedVehicle) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id ? { ...v, ...updatedVehicle } : v
          ),
        })),

      removeVehicle: (id) =>
        set((state) => {
          const newVehicles = state.vehicles.filter((v) => v.id !== id);
          const newSelectedId =
            state.selectedVehicleId === id
              ? newVehicles.length > 0
                ? newVehicles[0].id
                : null
              : state.selectedVehicleId;

          return {
            vehicles: newVehicles,
            selectedVehicleId: newSelectedId,
          };
        }),

      setSelectedVehicleId: (id) =>
        set({
          selectedVehicleId: id,
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      getSelectedVehicle: () => {
        const { vehicles, selectedVehicleId } = get();
        return vehicles.find((v) => v.id === selectedVehicleId) || null;
      },
    }),
    { name: 'VehicleStore' }
  )
);

