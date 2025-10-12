import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  positiveNumberSchema,
  positiveIntegerSchema,
  odometerSchema,
  pastDateSchema,
  yearSchema,
  isValidISODate,
  validateOdometerMonotonicity
} from '../validators';

describe('Validators', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow();
      expect(() => emailSchema.parse('user.name@domain.co.uk')).not.toThrow();
      expect(() => emailSchema.parse('user+tag@example.org')).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
      expect(() => emailSchema.parse('test@')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
      expect(() => emailSchema.parse('')).toThrow();
    });
  });

  describe('passwordSchema', () => {
    it('should validate passwords with 8+ characters', () => {
      expect(() => passwordSchema.parse('password123')).not.toThrow();
      expect(() => passwordSchema.parse('12345678')).not.toThrow();
      expect(() => passwordSchema.parse('verylongpassword')).not.toThrow();
    });

    it('should reject passwords with less than 8 characters', () => {
      expect(() => passwordSchema.parse('1234567')).toThrow();
      expect(() => passwordSchema.parse('short')).toThrow();
      expect(() => passwordSchema.parse('')).toThrow();
    });
  });

  describe('positiveNumberSchema', () => {
    it('should validate positive numbers', () => {
      expect(() => positiveNumberSchema.parse(1)).not.toThrow();
      expect(() => positiveNumberSchema.parse(0.5)).not.toThrow();
      expect(() => positiveNumberSchema.parse(100)).not.toThrow();
    });

    it('should reject non-positive numbers', () => {
      expect(() => positiveNumberSchema.parse(0)).toThrow();
      expect(() => positiveNumberSchema.parse(-1)).toThrow();
      expect(() => positiveNumberSchema.parse(-0.5)).toThrow();
    });
  });

  describe('positiveIntegerSchema', () => {
    it('should validate positive integers', () => {
      expect(() => positiveIntegerSchema.parse(1)).not.toThrow();
      expect(() => positiveIntegerSchema.parse(100)).not.toThrow();
      expect(() => positiveIntegerSchema.parse(999999)).not.toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => positiveIntegerSchema.parse(1.5)).toThrow();
      expect(() => positiveIntegerSchema.parse(0.1)).toThrow();
    });

    it('should reject non-positive numbers', () => {
      expect(() => positiveIntegerSchema.parse(0)).toThrow();
      expect(() => positiveIntegerSchema.parse(-1)).toThrow();
    });
  });

  describe('odometerSchema', () => {
    it('should validate odometer values', () => {
      expect(() => odometerSchema.parse(1000)).not.toThrow();
      expect(() => odometerSchema.parse(50000)).not.toThrow();
      expect(() => odometerSchema.parse(1)).not.toThrow();
    });

    it('should reject invalid odometer values', () => {
      expect(() => odometerSchema.parse(0)).toThrow();
      expect(() => odometerSchema.parse(-100)).toThrow();
      expect(() => odometerSchema.parse(1.5)).toThrow();
    });
  });

  describe('pastDateSchema', () => {
    it('should validate past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      expect(() => pastDateSchema.parse(yesterdayStr)).not.toThrow();
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];
      
      expect(() => pastDateSchema.parse(lastWeekStr)).not.toThrow();
    });

    it('should validate today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(() => pastDateSchema.parse(today)).not.toThrow();
    });

    it('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      expect(() => pastDateSchema.parse(tomorrowStr)).toThrow();
    });
  });

  describe('yearSchema', () => {
    it('should validate valid years', () => {
      expect(() => yearSchema.parse(2020)).not.toThrow();
      expect(() => yearSchema.parse(1990)).not.toThrow();
      expect(() => yearSchema.parse(1900)).not.toThrow();
    });

    it('should reject years before 1900', () => {
      expect(() => yearSchema.parse(1899)).toThrow();
      expect(() => yearSchema.parse(1800)).toThrow();
    });

    it('should reject future years', () => {
      const nextYear = new Date().getFullYear() + 2;
      expect(() => yearSchema.parse(nextYear)).toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => yearSchema.parse(2020.5)).toThrow();
    });
  });

  describe('isValidISODate', () => {
    it('should validate correct ISO dates', () => {
      expect(isValidISODate('2023-12-25')).toBe(true);
      expect(isValidISODate('2024-01-01')).toBe(true);
      expect(isValidISODate('2000-06-15')).toBe(true);
    });

    it('should reject invalid ISO date formats', () => {
      expect(isValidISODate('2023/12/25')).toBe(false);
      expect(isValidISODate('25-12-2023')).toBe(false);
      expect(isValidISODate('2023-12-25T10:30:00Z')).toBe(false);
      expect(isValidISODate('invalid')).toBe(false);
      expect(isValidISODate('')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(isValidISODate('2023-13-01')).toBe(false); // Invalid month
      expect(isValidISODate('2023-02-30')).toBe(false); // Invalid day
      expect(isValidISODate('2023-04-31')).toBe(false); // Invalid day
    });
  });

  describe('validateOdometerMonotonicity', () => {
    it('should validate when no previous value', () => {
      expect(validateOdometerMonotonicity(1000)).toBe(true);
      expect(validateOdometerMonotonicity(1000, undefined)).toBe(true);
    });

    it('should validate increasing odometer values', () => {
      expect(validateOdometerMonotonicity(2000, 1000)).toBe(true);
      expect(validateOdometerMonotonicity(1500, 1000)).toBe(true);
      expect(validateOdometerMonotonicity(1001, 1000)).toBe(true);
    });

    it('should reject decreasing odometer values', () => {
      expect(validateOdometerMonotonicity(1000, 2000)).toBe(false);
      expect(validateOdometerMonotonicity(500, 1000)).toBe(false);
      expect(validateOdometerMonotonicity(999, 1000)).toBe(false);
    });

    it('should reject equal odometer values', () => {
      expect(validateOdometerMonotonicity(1000, 1000)).toBe(false);
    });
  });
});
