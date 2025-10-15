/**
 * Measurement units constants
 */

export const DISTANCE_UNITS = {
  KM: 'km',
  MI: 'mi',
} as const;

export const VOLUME_UNITS = {
  LITERS: 'L',
  GALLONS: 'gal',
} as const;

export const CONSUMPTION_UNITS = {
  L_PER_100KM: 'L/100km',
  MPG: 'mpg',
} as const;

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
] as const;

export const DISTANCE_UNIT_OPTIONS = [
  { value: DISTANCE_UNITS.KM, label: 'Kilometers (km)' },
  { value: DISTANCE_UNITS.MI, label: 'Miles (mi)' },
] as const;

export const VOLUME_UNIT_OPTIONS = [
  { value: VOLUME_UNITS.LITERS, label: 'Liters (L)' },
  { value: VOLUME_UNITS.GALLONS, label: 'Gallons (gal)' },
] as const;

export const FUEL_TYPES = [
  'Gasoline',
  'Diesel',
  'Electric',
  'Hybrid',
  'LPG',
  'CNG',
] as const;

export const FUEL_GRADES = [
  'Regular',
  'Premium',
  'Diesel',
  'E85',
  'E10',
] as const;
