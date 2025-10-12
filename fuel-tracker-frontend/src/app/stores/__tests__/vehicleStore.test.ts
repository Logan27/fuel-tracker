import { describe, it, expect, beforeEach } from 'vitest';
import { useVehicleStore } from '../vehicleStore';
import type { Vehicle } from '@/entities/vehicle';

describe('vehicleStore', () => {
  const mockVehicles: Vehicle[] = [
    {
      id: 1,
      name: 'Tesla Model 3',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      fuel_type: 'electric',
      is_active: true,
      user: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Toyota Camry',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      fuel_type: 'gasoline',
      is_active: true,
      user: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset store before each test
    useVehicleStore.setState({
      vehicles: [],
      selectedVehicleId: null,
    });
  });

  it('should have initial state', () => {
    const state = useVehicleStore.getState();
    expect(state.vehicles).toEqual([]);
    expect(state.selectedVehicleId).toBeNull();
  });

  it('should set vehicles', () => {
    useVehicleStore.getState().setVehicles(mockVehicles);

    const state = useVehicleStore.getState();
    expect(state.vehicles).toEqual(mockVehicles);
    expect(state.vehicles.length).toBe(2);
  });

  it('should set selected vehicle ID', () => {
    useVehicleStore.getState().setSelectedVehicleId(1);

    const state = useVehicleStore.getState();
    expect(state.selectedVehicleId).toBe(1);
  });

  it('should get selected vehicle', () => {
    useVehicleStore.setState({
      vehicles: mockVehicles,
      selectedVehicleId: 1,
    });

    const selectedVehicle = useVehicleStore.getState().getSelectedVehicle();
    expect(selectedVehicle).toEqual(mockVehicles[0]);
    expect(selectedVehicle?.name).toBe('Tesla Model 3');
  });

  it('should return null if no vehicle is selected', () => {
    useVehicleStore.setState({
      vehicles: mockVehicles,
      selectedVehicleId: null,
    });

    const selectedVehicle = useVehicleStore.getState().getSelectedVehicle();
    expect(selectedVehicle).toBeNull();
  });

  it('should return null if selected vehicle not found', () => {
    useVehicleStore.setState({
      vehicles: mockVehicles,
      selectedVehicleId: 999, // Non-existent ID
    });

    const selectedVehicle = useVehicleStore.getState().getSelectedVehicle();
    expect(selectedVehicle).toBeNull();
  });

  it('should clear selected vehicle', () => {
    useVehicleStore.setState({
      vehicles: mockVehicles,
      selectedVehicleId: 1,
    });

    useVehicleStore.getState().setSelectedVehicleId(null);

    const state = useVehicleStore.getState();
    expect(state.selectedVehicleId).toBeNull();
  });
});

