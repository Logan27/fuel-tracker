/**
 * Конвертеры единиц измерения
 */

// Константы конвертации
const KM_TO_MI = 0.621371;
const MI_TO_KM = 1.60934;
const L_TO_GAL = 0.264172;
const GAL_TO_L = 3.78541;

/**
 * Конвертация километров в мили
 */
export const kmToMiles = (km: number): number => {
  return km * KM_TO_MI;
};

/**
 * Конвертация миль в километры
 */
export const milesToKm = (miles: number): number => {
  return miles * MI_TO_KM;
};

/**
 * Конвертация литров в галлоны
 */
export const litersToGallons = (liters: number): number => {
  return liters * L_TO_GAL;
};

/**
 * Конвертация галлонов в литры
 */
export const gallonsToLiters = (gallons: number): number => {
  return gallons * GAL_TO_L;
};

/**
 * Универсальная конвертация расстояния
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
 * Универсальная конвертация объёма
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
 * Конвертация расхода топлива L/100km ↔ MPG (US)
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

