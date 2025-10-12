import { describe, it, expect } from 'vitest';
import {
  kmToMiles,
  milesToKm,
  litersToGallons,
  gallonsToLiters,
  convertDistance,
  convertVolume,
  convertConsumption,
} from '../converters';

describe('converters', () => {
  describe('kmToMiles', () => {
    it('should convert kilometers to miles correctly', () => {
      expect(kmToMiles(100)).toBeCloseTo(62.1371, 4);
      expect(kmToMiles(0)).toBe(0);
      expect(kmToMiles(1)).toBeCloseTo(0.621371, 6);
    });
  });

  describe('milesToKm', () => {
    it('should convert miles to kilometers correctly', () => {
      expect(milesToKm(100)).toBeCloseTo(160.934, 3);
      expect(milesToKm(0)).toBe(0);
      expect(milesToKm(1)).toBeCloseTo(1.60934, 5);
    });
  });

  describe('litersToGallons', () => {
    it('should convert liters to gallons correctly', () => {
      expect(litersToGallons(100)).toBeCloseTo(26.4172, 4);
      expect(litersToGallons(0)).toBe(0);
      expect(litersToGallons(1)).toBeCloseTo(0.264172, 6);
    });
  });

  describe('gallonsToLiters', () => {
    it('should convert gallons to liters correctly', () => {
      expect(gallonsToLiters(10)).toBeCloseTo(37.8541, 4);
      expect(gallonsToLiters(0)).toBe(0);
      expect(gallonsToLiters(1)).toBeCloseTo(3.78541, 5);
    });
  });

  describe('convertDistance', () => {
    it('should return same value when units are the same', () => {
      expect(convertDistance(100, 'km', 'km')).toBe(100);
      expect(convertDistance(50, 'mi', 'mi')).toBe(50);
    });

    it('should convert km to mi', () => {
      expect(convertDistance(100, 'km', 'mi')).toBeCloseTo(62.1371, 4);
    });

    it('should convert mi to km', () => {
      expect(convertDistance(100, 'mi', 'km')).toBeCloseTo(160.934, 3);
    });
  });

  describe('convertVolume', () => {
    it('should return same value when units are the same', () => {
      expect(convertVolume(50, 'L', 'L')).toBe(50);
      expect(convertVolume(20, 'gal', 'gal')).toBe(20);
    });

    it('should convert L to gal', () => {
      expect(convertVolume(100, 'L', 'gal')).toBeCloseTo(26.4172, 4);
    });

    it('should convert gal to L', () => {
      expect(convertVolume(10, 'gal', 'L')).toBeCloseTo(37.8541, 4);
    });
  });

  describe('convertConsumption', () => {
    it('should return same value when units are the same', () => {
      expect(convertConsumption(8, 'L/100km', 'L/100km')).toBe(8);
      expect(convertConsumption(30, 'mpg', 'mpg')).toBe(30);
    });

    it('should convert L/100km to mpg correctly', () => {
      // 8 L/100km ≈ 29.4 MPG (US)
      expect(convertConsumption(8, 'L/100km', 'mpg')).toBeCloseTo(29.4, 1);
      // 10 L/100km ≈ 23.5 MPG (US)
      expect(convertConsumption(10, 'L/100km', 'mpg')).toBeCloseTo(23.5, 1);
    });

    it('should convert mpg to L/100km correctly', () => {
      // 30 MPG (US) ≈ 7.84 L/100km
      expect(convertConsumption(30, 'mpg', 'L/100km')).toBeCloseTo(7.84, 2);
      // 25 MPG (US) ≈ 9.41 L/100km
      expect(convertConsumption(25, 'mpg', 'L/100km')).toBeCloseTo(9.41, 2);
    });

    it('should be reversible', () => {
      const original = 8.5;
      const toMpg = convertConsumption(original, 'L/100km', 'mpg');
      const backToL = convertConsumption(toMpg, 'mpg', 'L/100km');
      expect(backToL).toBeCloseTo(original, 2);
    });
  });
});

