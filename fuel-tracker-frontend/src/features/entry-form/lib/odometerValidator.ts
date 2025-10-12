import { apiClient } from '@/shared/api';
import type { FuelEntry } from '@/entities/fuel-entry';

/**
 * Валидация монотонности одометра
 * Проверяет, что новое значение одометра больше предыдущего для данного автомобиля
 */
export const validateOdometerMonotonicity = async (
  vehicleId: number,
  newOdometer: number,
  excludeEntryId?: number
): Promise<{ isValid: boolean; lastOdometer?: number; message?: string }> => {
  try {
    // Получаем последнюю запись для данного автомобиля
    const response = await apiClient.get<{ results: FuelEntry[] }>(
      '/fuel-entries/',
      {
        params: {
          vehicle: vehicleId,
          limit: 1,
          ordering: '-entry_date,-created_at',
        },
      }
    );

    const entries = response.data.results;

    if (entries.length === 0) {
      // Нет предыдущих записей - любое положительное значение валидно
      return { isValid: true };
    }

    const lastEntry = entries[0];

    // Если редактируем существующую запись, исключаем её из проверки
    if (excludeEntryId && lastEntry.id === excludeEntryId) {
      return { isValid: true };
    }

    const lastOdometer = lastEntry.odometer;

    if (newOdometer <= lastOdometer) {
      return {
        isValid: false,
        lastOdometer,
        message: `Odometer value must be greater than the last entry (${lastOdometer} km)`,
      };
    }

    return { isValid: true, lastOdometer };
  } catch (error) {
    console.error('Error validating odometer:', error);
    // В случае ошибки API, разрешаем ввод (не блокируем пользователя)
    return { isValid: true };
  }
};

/**
 * Вычисление пройденного расстояния с последней заправки
 */
export const calculateDistanceSinceLastEntry = (
  currentOdometer: number,
  lastOdometer: number
): number => {
  return Math.max(0, currentOdometer - lastOdometer);
};

/**
 * Вычисление расхода топлива (L/100km)
 */
export const calculateConsumption = (
  liters: number,
  distanceKm: number
): number => {
  if (distanceKm === 0) return 0;
  return (liters / distanceKm) * 100;
};

/**
 * Вычисление стоимости за километр
 */
export const calculateCostPerKm = (
  totalAmount: number,
  distanceKm: number
): number => {
  if (distanceKm === 0) return 0;
  return totalAmount / distanceKm;
};

/**
 * Вычисление цены за литр
 */
export const calculateUnitPrice = (totalAmount: number, liters: number): number => {
  if (liters === 0) return 0;
  return totalAmount / liters;
};

