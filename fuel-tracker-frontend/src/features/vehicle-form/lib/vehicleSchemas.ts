import { z } from 'zod';
import { FUEL_TYPES } from '@/shared/lib/constants';

/**
 * Схема для создания/редактирования автомобиля
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
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional()
    .nullable(),
  fuel_type: z
    .string()
    .max(20, 'Fuel type must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
});

/**
 * Тип данных формы автомобиля
 */
export type VehicleFormData = z.infer<typeof vehicleSchema>;

/**
 * Дефолтные значения для формы
 */
export const defaultVehicleValues: VehicleFormData = {
  name: '',
  make: '',
  model: '',
  year: null,
  fuel_type: '',
  is_active: true,
};

