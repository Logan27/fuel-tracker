import { z } from 'zod';
import { FUEL_TYPES } from '@/shared/lib/constants';

/**
 * Schema for creating/editing vehicle
 */
export const vehicleSchema = z.object({
  name: z
    .string()
    .min(1, 'Vehicle name is required')
    .max(100, 'Vehicle name must be less than 100 characters'),
  make: z.string().max(50, 'Make must be less than 50 characters').optional().or(z.literal('')),
  model: z.string().max(50, 'Model must be less than 50 characters').optional().or(z.literal('')),
  year: z
    .number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, `Year cannot be in the future`)
    .nullable(),
  initial_odometer: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) || 0 : val))
    .pipe(z.number().int().nonnegative('Initial odometer cannot be negative')),
  fuel_type: z.string().max(50, 'Fuel type must be 50 characters or less').optional(),
  is_active: z.boolean().default(true),
});

/**
 * Vehicle form data type
 */
export type VehicleFormData = z.infer<typeof vehicleSchema>;

/**
 * Default values for form
 */
export const defaultVehicleValues: VehicleFormData = {
  name: '',
  make: '',
  model: '',
  year: null,
  fuel_type: '',
  is_active: true,
};

