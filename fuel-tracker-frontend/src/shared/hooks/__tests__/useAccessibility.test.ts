import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useScreenReader,
  useHighContrast,
  useReducedMotion,
  useAccessibilityAnnouncements,
  useColorContrast,
  useFocusManagement,
  useKeyboardNavigation,
  useAccessibilityTesting,
  useAccessibilityPreferences
} from '../useAccessibility';

// Mock accessibility utilities
vi.mock('../../lib/accessibility', () => ({
  isScreenReaderActive: vi.fn(),
  isHighContrastMode: vi.fn(),
  prefersReducedMotion: vi.fn(),
  announceToScreenReader: vi.fn(),
  getContrastRatio: vi.fn(),
  isAccessibleContrast: vi.fn(),
}));

import {
  isScreenReaderActive,
  isHighContrastMode,
  prefersReducedMotion,
  announceToScreenReader,
  getContrastRatio,
  isAccessibleContrast
} from '../../lib/accessibility';

describe('useAccessibility hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useScreenReader', () => {
    it('should return screen reader status', () => {
      vi.mocked(isScreenReaderActive).mockReturnValue(true);
      
      const { result } = renderHook(() => useScreenReader());
      expect(result.current).toBe(true);
    });

    it('should return false when screen reader is not active', () => {
      vi.mocked(isScreenReaderActive).mockReturnValue(false);
      
      const { result } = renderHook(() => useScreenReader());
      expect(result.current).toBe(false);
    });
  });

  describe('useHighContrast', () => {
    it('should return high contrast status', () => {
      vi.mocked(isHighContrastMode).mockReturnValue(true);
      
      const { result } = renderHook(() => useHighContrast());
      expect(result.current).toBe(true);
    });

    it('should return false when high contrast is not active', () => {
      vi.mocked(isHighContrastMode).mockReturnValue(false);
      
      const { result } = renderHook(() => useHighContrast());
      expect(result.current).toBe(false);
    });
  });

  describe('useReducedMotion', () => {
    it('should return reduced motion preference', () => {
      vi.mocked(prefersReducedMotion).mockReturnValue(true);
      
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    });

    it('should return false when reduced motion is not preferred', () => {
      vi.mocked(prefersReducedMotion).mockReturnValue(false);
      
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
    });
  });

  describe('useAccessibilityAnnouncements', () => {
    it('should provide announce function', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      expect(typeof result.current.announce).toBe('function');
    });

    it('should call announceToScreenReader with message', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      result.current.announce('Test message');
      
      expect(announceToScreenReader).toHaveBeenCalledWith('Test message', 'polite');
    });

    it('should call announceToScreenReader with priority', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncements());
      
      result.current.announce('Test message', 'assertive');
      
      expect(announceToScreenReader).toHaveBeenCalledWith('Test message', 'assertive');
    });
  });

  describe('useColorContrast', () => {
    it('should calculate contrast ratio and accessibility', () => {
      vi.mocked(getContrastRatio).mockReturnValue(4.5);
      vi.mocked(isAccessibleContrast).mockReturnValue(true);
      
      const { result } = renderHook(() => useColorContrast('#000000', '#ffffff'));
      
      expect(result.current.contrastRatio).toBe(4.5);
      expect(result.current.isAccessible).toBe(true);
    });

    it('should recalculate when colors change', () => {
      vi.mocked(getContrastRatio).mockReturnValue(2.0);
      vi.mocked(isAccessibleContrast).mockReturnValue(false);
      
      const { result, rerender } = renderHook(
        ({ fg, bg }) => useColorContrast(fg, bg),
        { initialProps: { fg: '#000000', bg: '#ffffff' } }
      );
      
      expect(result.current.contrastRatio).toBe(2.0);
      expect(result.current.isAccessible).toBe(false);
      
      // Change colors
      rerender({ fg: '#ff0000', bg: '#00ff00' });
      
      expect(getContrastRatio).toHaveBeenCalledWith('#ff0000', '#00ff00');
    });
  });

  describe('useFocusManagement', () => {
    it('should provide focus management functions', () => {
      const { result } = renderHook(() => useFocusManagement());
      
      expect(typeof result.current.focusElement).toBe('function');
      expect(typeof result.current.blurElement).toBe('function');
      expect(typeof result.current.focusNext).toBe('function');
      expect(typeof result.current.focusPrevious).toBe('function');
    });

    it('should focus element when focusElement is called', () => {
      const { result } = renderHook(() => useFocusManagement());
      const element = document.createElement('button');
      const focusSpy = vi.spyOn(element, 'focus');
      
      result.current.focusElement(element);
      
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should blur element when blurElement is called', () => {
      const { result } = renderHook(() => useFocusManagement());
      const element = document.createElement('button');
      const blurSpy = vi.spyOn(element, 'blur');
      
      result.current.blurElement(element);
      
      expect(blurSpy).toHaveBeenCalled();
    });
  });

  describe('useKeyboardNavigation', () => {
    it('should detect keyboard user', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      // Initially should be false
      expect(result.current).toBe(false);
    });

    it('should update when Tab key is pressed', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      // Simulate Tab key press
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);
      
      expect(result.current).toBe(true);
    });

    it('should reset when mouse is used', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      
      // First set to true with keyboard
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);
      expect(result.current).toBe(true);
      
      // Then reset with mouse
      const mouseEvent = new MouseEvent('mousedown');
      document.dispatchEvent(mouseEvent);
      expect(result.current).toBe(false);
    });
  });

  describe('useAccessibilityTesting', () => {
    it('should provide test results and runTests function', () => {
      const { result } = renderHook(() => useAccessibilityTesting());
      
      expect(result.current.testResults).toEqual({
        errors: [],
        warnings: [],
        passed: 0,
        total: 0
      });
      expect(typeof result.current.runTests).toBe('function');
    });

    it('should run tests and update results', () => {
      const { result } = renderHook(() => useAccessibilityTesting());
      
      // Create a test container with some elements
      const container = document.createElement('div');
      const button = document.createElement('button');
      const img = document.createElement('img');
      container.appendChild(button);
      container.appendChild(img);
      
      result.current.runTests(container);
      
      expect(result.current.testResults.total).toBe(3); // div, button, img
      expect(result.current.testResults.warnings).toContain('Image missing alt text');
    });
  });

  describe('useAccessibilityPreferences', () => {
    it('should return accessibility preferences', () => {
      vi.mocked(isScreenReaderActive).mockReturnValue(true);
      vi.mocked(isHighContrastMode).mockReturnValue(false);
      vi.mocked(prefersReducedMotion).mockReturnValue(true);
      
      const { result } = renderHook(() => useAccessibilityPreferences());
      
      expect(result.current).toEqual({
        screenReader: true,
        highContrast: false,
        reducedMotion: true,
        keyboardNavigation: false
      });
    });
  });
});
