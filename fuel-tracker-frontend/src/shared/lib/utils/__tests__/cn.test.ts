import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
    expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({
      'class1': true,
      'class2': false,
      'class3': true
    })).toBe('class1 class3');
  });

  it('should handle mixed inputs', () => {
    expect(cn(
      'base-class',
      ['array-class1', 'array-class2'],
      {
        'object-class1': true,
        'object-class2': false
      },
      'px-2 py-1',
      'px-4'
    )).toBe('base-class array-class1 array-class2 object-class1 py-1 px-4');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });

  it('should handle Tailwind CSS conflicts', () => {
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle complex Tailwind CSS scenarios', () => {
    expect(cn('px-2 py-1 bg-red-500', 'px-4 bg-blue-500')).toBe('py-1 px-4 bg-blue-500');
    expect(cn('text-sm font-bold', 'text-lg font-normal')).toBe('text-lg font-normal');
  });
});
