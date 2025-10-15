import { z } from 'zod';

/**
 * Schema for creating/editing fuel entry
 */
export const entrySchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle is required'),
  entry_date: z.string().min(1, 'Date is required'),
  odometer: z
    .number()
    .positive('Odometer must be positive')
    .max(9999999, 'Odometer value is too large'),
  station_name: z
    .string()
    .min(1, 'Station name is required')
    .max(100, 'Station name must be less than 100 characters'),
  fuel_brand: z
    .string()
    .min(1, 'Fuel brand is required')
    .max(50, 'Fuel brand must be less than 50 characters'),
  fuel_grade: z
    .string()
    .min(1, 'Fuel grade is required')
    .max(30, 'Fuel grade must be less than 30 characters'),
  liters: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    })
    .pipe(z.number().positive('Liters must be positive').max(999, 'Liters value is too large')),
  total_amount: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    })
    .pipe(z.number().positive('Total amount must be positive').max(999999, 'Total amount is too large')),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

/**
 * Fuel entry form data type
 */
export type EntryFormData = z.infer<typeof entrySchema>;

/**
 * Default values for form
 */
export const defaultEntryValues: Partial<EntryFormData> = {
  entry_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
  station_name: '',
  fuel_brand: '',
  fuel_grade: '',
  notes: '',
};

/**
 * Common fuel brands for autocomplete
 */
export const COMMON_FUEL_BRANDS = [
  'Shell',
  'BP',
  'ExxonMobil',
  'Chevron',
  'Total',
  'Lukoil',
  'Gazprom',
  'Rosneft',
  'Tatneft',
  'Other',
] as const;

/**
 * Common fuel grades
 */
export const COMMON_FUEL_GRADES = [
  'Regular (87)',
  'Midgrade (89)',
  'Premium (91)',
  'Premium (93)',
  'Premium (95)',
  'Premium (98)',
  'Diesel',
  'E85',
] as const;

