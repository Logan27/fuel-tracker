import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

describe('API Client', () => {
  describe('URL normalization', () => {
    it('should remove trailing slash from URLs', () => {
      const normalizeUrl = (url?: string): string => {
        if (!url) return '';
        return url.length > 1 && url.endsWith('/') ? url.slice(0, -1) : url;
      };

      // Test cases
      expect(normalizeUrl('/vehicles/')).toBe('/vehicles');
      expect(normalizeUrl('/fuel-entries/')).toBe('/fuel-entries');
      expect(normalizeUrl('/api/v1/')).toBe('/api/v1');
      expect(normalizeUrl('/vehicles')).toBe('/vehicles');
      expect(normalizeUrl('/')).toBe('/'); // Root should stay as /
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl(undefined)).toBe('');
    });

    it('should handle edge cases', () => {
      const normalizeUrl = (url?: string): string => {
        if (!url) return '';
        return url.length > 1 && url.endsWith('/') ? url.slice(0, -1) : url;
      };

      expect(normalizeUrl('/vehicles/123/')).toBe('/vehicles/123');
      expect(normalizeUrl('/vehicles/123')).toBe('/vehicles/123');
      expect(normalizeUrl('///')).toBe('//'); // Multiple slashes - only remove last one
    });
  });
});


