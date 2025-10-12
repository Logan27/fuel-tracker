import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatDistance,
  formatVolume,
  formatConsumption,
} from '../formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format date from string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('15.01.2024');
    });

    it('should format date from Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBe('15.01.2024');
    });

    it('should use custom format string', () => {
      const result = formatDate('2024-01-15', 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toMatch(/15\.01\.2024 \d{2}:\d{2}/);
    });
  });

  describe('formatNumber', () => {
    it('should format number with default 2 decimals', () => {
      expect(formatNumber(123.456)).toBe('123.46');
      expect(formatNumber(100)).toBe('100.00');
    });

    it('should format number with custom decimals', () => {
      expect(formatNumber(123.456, 0)).toBe('123');
      expect(formatNumber(123.456, 1)).toBe('123.5');
      expect(formatNumber(123.456, 3)).toBe('123.456');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default USD', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should format currency with custom currency code', () => {
      const result = formatCurrency(1234.56, 'EUR', 'de-DE');
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });
  });

  describe('formatDistance', () => {
    it('should format distance in km', () => {
      expect(formatDistance(100, 'km')).toBe('100 km');
      expect(formatDistance(1234.567, 'km')).toBe('1235 km');
    });

    it('should format distance in mi', () => {
      expect(formatDistance(100, 'mi')).toBe('100 mi');
      expect(formatDistance(62.137, 'mi')).toBe('62 mi');
    });
  });

  describe('formatVolume', () => {
    it('should format volume in L', () => {
      expect(formatVolume(45.5, 'L')).toBe('45.50 L');
      expect(formatVolume(100, 'L')).toBe('100.00 L');
    });

    it('should format volume in gal', () => {
      expect(formatVolume(12.5, 'gal')).toBe('12.50 gal');
      expect(formatVolume(10, 'gal')).toBe('10.00 gal');
    });
  });

  describe('formatConsumption', () => {
    it('should format consumption in L/100km', () => {
      expect(formatConsumption(8.5, 'km', 'L')).toBe('8.5 L/100km');
      expect(formatConsumption(10, 'km', 'L')).toBe('10.0 L/100km');
    });

    it('should format consumption in mpg', () => {
      expect(formatConsumption(30, 'mi', 'gal')).toBe('30.0 mpg');
      expect(formatConsumption(25.5, 'mi', 'gal')).toBe('25.5 mpg');
    });
  });
});

