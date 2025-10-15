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
export const formatNumber = (value: number, decimals = 2): string => {
  return value.toFixed(decimals);
};

/**
 * Format currency
 */
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format distance with units
 */
export const formatDistance = (distance: number, unit: 'km' | 'mi' = 'km'): string => {
  return `${formatNumber(distance, 0)} ${unit}`;
};

/**
 * Format fuel volume
 */
export const formatVolume = (volume: number, unit: 'L' | 'gal' = 'L'): string => {
  return `${formatNumber(volume, 2)} ${unit}`;
};

/**
 * Format fuel consumption
 */
export const formatConsumption = (
  consumption: number,
  distanceUnit: 'km' | 'mi' = 'km',
  volumeUnit: 'L' | 'gal' = 'L'
): string => {
  const unit = distanceUnit === 'km' ? 'L/100km' : 'mpg';
  return `${formatNumber(consumption, 1)} ${unit}`;
};

