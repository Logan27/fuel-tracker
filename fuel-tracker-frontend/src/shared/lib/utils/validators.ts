import { z } from 'zod';

/**
 * Validation email
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Validation password (Minimum 8 characters)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

/**
 * Validate positive number
 */
export const positiveNumberSchema = z.number().positive('Must be a positive number');

/**
 * Validate positive integer
 */
export const positiveIntegerSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be a positive number');

/**
 * Validate odometer (positive integer)
 */
export const odometerSchema = positiveIntegerSchema;

/**
 * Validate date (not in future)
 */
export const pastDateSchema = z.string().refine(
  (date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  },
  { message: 'Date cannot be in the future' }
);

/**
 * Validate year (1900-current year)
 */
export const yearSchema = z
  .number()
  .int()
  .min(1900, 'Year must be 1900 or later')
  .max(new Date().getFullYear() + 1, 'Year cannot be in the future');

/**
 * Check if string is valid ISO date
 */
export const isValidISODate = (date: string): boolean => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(date)) return false;
  
  const parsed = new Date(date);
  return parsed instanceof Date && !isNaN(parsed.getTime());
};

/**
 * Odometer monotonicity check
 */
export const validateOdometerMonotonicity = (
  newValue: number,
  lastValue?: number
): boolean => {
  if (lastValue === undefined) return true;
  return newValue > lastValue;
};

