import { format, parseISO } from 'date-fns';

/**
 * Форматирование даты в локальный формат
 */
export const formatDate = (date: string | Date, formatStr = 'dd.MM.yyyy'): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

/**
 * Форматирование даты и времени
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
};

/**
 * Форматирование числа с заданным количеством десятичных знаков
 */
export const formatNumber = (value: number, decimals = 2): string => {
  return value.toFixed(decimals);
};

/**
 * Форматирование валюты
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
 * Форматирование расстояния с единицами измерения
 */
export const formatDistance = (distance: number, unit: 'km' | 'mi' = 'km'): string => {
  return `${formatNumber(distance, 0)} ${unit}`;
};

/**
 * Форматирование объёма топлива
 */
export const formatVolume = (volume: number, unit: 'L' | 'gal' = 'L'): string => {
  return `${formatNumber(volume, 2)} ${unit}`;
};

/**
 * Форматирование расхода топлива
 */
export const formatConsumption = (
  consumption: number,
  distanceUnit: 'km' | 'mi' = 'km',
  volumeUnit: 'L' | 'gal' = 'L'
): string => {
  const unit = distanceUnit === 'km' ? 'L/100km' : 'mpg';
  return `${formatNumber(consumption, 1)} ${unit}`;
};

