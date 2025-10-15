import { apiClient } from '@/shared/api';
import type { FuelEntry } from '@/entities/fuel-entry';

/**
 * Validate odometer monotonicity
 * Check that new odometer value is greater than previous for this vehicle
 */
export const validateOdometerMonotonicity = async (
  vehicleId: number,
  newOdometer: number,
  excludeEntryId?: number
): Promise<{ isValid: boolean; lastOdometer?: number; message?: string }> => {
  try {
    // If editing existing entry, skip client-side validation
    // Backend will validate against chronological neighbors properly
    if (excludeEntryId) {
      return { isValid: true };
    }

    // Get last entry for this vehicle (only for new entries)
    const response = await apiClient.get<{ results: FuelEntry[] }>(
      '/fuel-entries/',
      {
        params: {
          vehicle: vehicleId,
          limit: 1,
          ordering: '-entry_date,-created_at',
        },
      }
    );

    const entries = response.data.results;

    if (entries.length === 0) {
      // No previous entries - any positive value is valid
      return { isValid: true };
    }

    const lastEntry = entries[0];
    const lastOdometer = lastEntry.odometer;

    if (newOdometer <= lastOdometer) {
      return {
        isValid: false,
        lastOdometer,
        message: `Odometer value must be greater than the last entry (${lastOdometer} km)`,
      };
    }

    return { isValid: true, lastOdometer };
  } catch (error) {
    console.error('Error validating odometer:', error);
    // In case of API error, allow input (don't block user)
    return { isValid: true };
  }
};

/**
 * Distance calculation since last fill-up
 */
export const calculateDistanceSinceLastEntry = (
  currentOdometer: number,
  lastOdometer: number
): number => {
  return Math.max(0, currentOdometer - lastOdometer);
};

/**
 * Fuel consumption calculation (L/100km)
 */
export const calculateConsumption = (
  liters: number,
  distanceKm: number
): number => {
  if (distanceKm === 0) return 0;
  return (liters / distanceKm) * 100;
};

/**
 * Cost per kilometer calculation
 */
export const calculateCostPerKm = (
  totalAmount: number,
  distanceKm: number
): number => {
  if (distanceKm === 0) return 0;
  return totalAmount / distanceKm;
};

/**
 * Price per liter calculation
 */
export const calculateUnitPrice = (totalAmount: number, liters: number): number => {
  if (liters === 0) return 0;
  return totalAmount / liters;
};

