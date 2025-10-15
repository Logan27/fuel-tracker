/**
 * Unit converters
 */

// Conversion constants
const KM_TO_MI = 0.621371;
const MI_TO_KM = 1.60934;
const L_TO_GAL = 0.264172;
const GAL_TO_L = 3.78541;

/**
 * Convert kilometers to miles
 */
export const kmToMiles = (km: number): number => {
  return km * KM_TO_MI;
};

/**
 * Convert miles to kilometers
 */
export const milesToKm = (miles: number): number => {
  return miles * MI_TO_KM;
};

/**
 * Convert liters to gallons
 */
export const litersToGallons = (liters: number): number => {
  return liters * L_TO_GAL;
};

/**
 * Convert gallons to liters
 */
export const gallonsToLiters = (gallons: number): number => {
  return gallons * GAL_TO_L;
};

/**
 * Universal distance conversion
 */
export const convertDistance = (
  value: number,
  from: 'km' | 'mi',
  to: 'km' | 'mi'
): number => {
  if (from === to) return value;
  return from === 'km' ? kmToMiles(value) : milesToKm(value);
};

/**
 * Universal volume conversion
 */
export const convertVolume = (
  value: number,
  from: 'L' | 'gal',
  to: 'L' | 'gal'
): number => {
  if (from === to) return value;
  return from === 'L' ? litersToGallons(value) : gallonsToLiters(value);
};

/**
 * Convert fuel consumption L/100km ↔ MPG (US)
 */
export const convertConsumption = (
  value: number,
  from: 'L/100km' | 'mpg',
  to: 'L/100km' | 'mpg'
): number => {
  if (from === to) return value;
  
  if (from === 'L/100km') {
    // L/100km → MPG (US)
    return 235.214583 / value;
  } else {
    // MPG (US) → L/100km
    return 235.214583 / value;
  }
};

