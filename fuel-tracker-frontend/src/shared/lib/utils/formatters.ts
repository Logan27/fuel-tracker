import { format, parseISO } from 'date-fns';

/**
 * Format date to local format
 */
export const formatDate = (date: string | Date, formatStr = 'dd.MM.yyyy'): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
};

/**
 * Format number with specified decimal places
 */
export const formatNumber = (value: number | null | undefined, decimals = 2): string => {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals);
};

/**
 * Format currency
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currency = 'USD',
  locale = 'en-US'
): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format distance with units
 */
export const formatDistance = (distance: number | null | undefined, unit: 'km' | 'mi' = 'km'): string => {
  if (distance === null || distance === undefined) return 'N/A';
  return `${formatNumber(distance, 0)} ${unit}`;
};

/**
 * Format fuel volume
 */
export const formatVolume = (volume: number | null | undefined, unit: 'L' | 'gal' = 'L'): string => {
  if (volume === null || volume === undefined) return 'N/A';
  return `${formatNumber(volume, 2)} ${unit}`;
};

/**
 * Format fuel consumption
 */
export const formatConsumption = (
  consumption: number | null | undefined,
  distanceUnit: 'km' | 'mi' = 'km',
  volumeUnit: 'L' | 'gal' = 'L'
): string => {
  if (consumption === null || consumption === undefined) return 'N/A';
  const unit = distanceUnit === 'km' ? 'L/100km' : 'mpg';
  return `${formatNumber(consumption, 1)} ${unit}`;
};

