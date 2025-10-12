import { z } from 'zod';

/**
 * Валидация email
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Валидация пароля (минимум 8 символов)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

/**
 * Валидация положительного числа
 */
export const positiveNumberSchema = z.number().positive('Must be a positive number');

/**
 * Валидация положительного целого числа
 */
export const positiveIntegerSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be a positive number');

/**
 * Валидация одометра (положительное целое число)
 */
export const odometerSchema = positiveIntegerSchema;

/**
 * Валидация даты (не в будущем)
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
 * Валидация года (1900-текущий год)
 */
export const yearSchema = z
  .number()
  .int()
  .min(1900, 'Year must be 1900 or later')
  .max(new Date().getFullYear() + 1, 'Year cannot be in the future');

/**
 * Проверка является ли строка валидной датой ISO
 */
export const isValidISODate = (date: string): boolean => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(date)) return false;
  
  const parsed = new Date(date);
  return parsed instanceof Date && !isNaN(parsed.getTime());
};

/**
 * Проверка монотонности одометра
 */
export const validateOdometerMonotonicity = (
  newValue: number,
  lastValue?: number
): boolean => {
  if (lastValue === undefined) return true;
  return newValue > lastValue;
};

