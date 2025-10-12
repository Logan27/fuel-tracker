import { useMemo } from 'react';
import { useUserSettingsStore } from '@/app/stores';
import {
  convertDistance,
  convertVolume,
  convertConsumption,
  formatDistance,
  formatVolume,
  formatConsumption,
  formatCurrency,
} from '@/shared/lib/utils';

/**
 * Хук для конвертации и форматирования единиц измерения
 * согласно настройкам пользователя
 */
export const useUnitConversion = () => {
  const { preferred_currency, preferred_distance_unit, preferred_volume_unit, price_precision } =
    useUserSettingsStore();

  // Мемоизируем функции конвертации для оптимизации
  const convertDistanceFromKm = useMemo(() => (km: number): number => {
    return convertDistance(km, 'km', preferred_distance_unit);
  }, [preferred_distance_unit]);

  const convertVolumeFromLiters = useMemo(() => (liters: number): number => {
    return convertVolume(liters, 'L', preferred_volume_unit);
  }, [preferred_volume_unit]);

  const convertConsumptionFromMetric = useMemo(() => (l100km: number): number => {
    if (preferred_distance_unit === 'mi' && preferred_volume_unit === 'gal') {
      // L/100km → MPG (US)
      return convertConsumption(l100km, 'L/100km', 'mpg');
    }
    // Остаётся L/100km если используем km
    return l100km;
  }, [preferred_distance_unit, preferred_volume_unit]);

  const formatDistanceValue = useMemo(() => (km: number): string => {
    const converted = convertDistance(km, 'km', preferred_distance_unit);
    return formatDistance(converted, preferred_distance_unit);
  }, [preferred_distance_unit]);

  const formatVolumeValue = useMemo(() => (liters: number): string => {
    const converted = convertVolume(liters, 'L', preferred_volume_unit);
    return formatVolume(converted, preferred_volume_unit);
  }, [preferred_volume_unit]);

  const formatConsumptionValue = useMemo(() => (l100km: number): string => {
    const converted = convertConsumptionFromMetric(l100km);
    return formatConsumption(converted, preferred_distance_unit, preferred_volume_unit);
  }, [preferred_distance_unit, preferred_volume_unit, convertConsumptionFromMetric]);

  const formatCurrencyValue = useMemo(() => (amount: number): string => {
    return formatCurrency(amount, preferred_currency);
  }, [preferred_currency]);
  
  const formatPriceValue = useMemo(() => (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: preferred_currency,
      minimumFractionDigits: price_precision,
      maximumFractionDigits: price_precision,
    }).format(price);
  }, [preferred_currency, price_precision]);

  const getDistanceUnitLabel = useMemo(() => (): string => {
    return preferred_distance_unit;
  }, [preferred_distance_unit]);

  const getVolumeUnitLabel = useMemo(() => (): string => {
    return preferred_volume_unit;
  }, [preferred_volume_unit]);

  const getConsumptionUnitLabel = useMemo(() => (): string => {
    return preferred_distance_unit === 'mi' && preferred_volume_unit === 'gal'
      ? 'mpg'
      : 'L/100km';
  }, [preferred_distance_unit, preferred_volume_unit]);

  return {
    // Настройки
    currency: preferred_currency,
    distanceUnit: preferred_distance_unit,
    volumeUnit: preferred_volume_unit,
    pricePrecision: price_precision,

    // Функции конвертации
    convertDistanceFromKm,
    convertVolumeFromLiters,
    convertConsumptionFromMetric,

    // Функции форматирования
    formatDistance: formatDistanceValue,
    formatVolume: formatVolumeValue,
    formatConsumption: formatConsumptionValue,
    formatCurrency: formatCurrencyValue,
    formatPrice: formatPriceValue,

    // Метки единиц
    getDistanceUnitLabel,
    getVolumeUnitLabel,
    getConsumptionUnitLabel,
  };
};

