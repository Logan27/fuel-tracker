import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAriaLabel,
  getAriaExpanded,
  getAriaSelected,
  getAriaChecked,
  getAriaPressed,
  getAriaHidden,
  getAriaLive,
  getAriaAtomic,
  getRole,
  getTabIndex,
  focusElement,
  blurElement,
  announceToScreenReader,
  getContrastRatio,
  hexToRgb,
  isAccessibleContrast,
  isKeyboardEvent,
  shouldPreventDefault,
  addFocusVisibleClass,
  removeFocusVisibleClass,
  isHighContrastMode,
  prefersReducedMotion,
  isScreenReaderActive,
  validateAriaAttributes
} from '../accessibility';

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Accessibility Utils', () => {
  describe('ARIA helpers', () => {
    it('should create aria-label attributes', () => {
      const result = getAriaLabel('Test label');
      expect(result).toEqual({ 'aria-label': 'Test label' });
    });

    it('should create aria-label with description', () => {
      const result = getAriaLabel('Test label', 'test-description');
      expect(result).toEqual({ 
        'aria-label': 'Test label',
        'aria-describedby': 'test-description'
      });
    });

    it('should create aria-expanded attributes', () => {
      expect(getAriaExpanded(true)).toEqual({ 'aria-expanded': true });
      expect(getAriaExpanded(false)).toEqual({ 'aria-expanded': false });
    });

    it('should create aria-selected attributes', () => {
      expect(getAriaSelected(true)).toEqual({ 'aria-selected': true });
      expect(getAriaSelected(false)).toEqual({ 'aria-selected': false });
    });

    it('should create aria-checked attributes', () => {
      expect(getAriaChecked(true)).toEqual({ 'aria-checked': true });
      expect(getAriaChecked(false)).toEqual({ 'aria-checked': false });
    });

    it('should create aria-pressed attributes', () => {
      expect(getAriaPressed(true)).toEqual({ 'aria-pressed': true });
      expect(getAriaPressed(false)).toEqual({ 'aria-pressed': false });
    });

    it('should create aria-hidden attributes', () => {
      expect(getAriaHidden(true)).toEqual({ 'aria-hidden': true });
      expect(getAriaHidden(false)).toEqual({ 'aria-hidden': false });
    });

    it('should create aria-live attributes', () => {
      expect(getAriaLive()).toEqual({ 'aria-live': 'assertive' });
      expect(getAriaLive(true)).toEqual({ 'aria-live': 'polite' });
    });

    it('should create aria-atomic attributes', () => {
      expect(getAriaAtomic()).toEqual({ 'aria-atomic': true });
      expect(getAriaAtomic(false)).toEqual({ 'aria-atomic': false });
    });

    it('should create role attributes', () => {
      expect(getRole('button')).toEqual({ role: 'button' });
      expect(getRole('link')).toEqual({ role: 'link' });
    });

    it('should create tabindex attributes', () => {
      expect(getTabIndex(0)).toEqual({ tabIndex: 0 });
      expect(getTabIndex(-1)).toEqual({ tabIndex: -1 });
      expect(getTabIndex('auto')).toEqual({ tabIndex: 0 });
      expect(getTabIndex('none')).toEqual({ tabIndex: -1 });
    });
  });

  describe('Focus management', () => {
    it('should focus element', () => {
      const element = document.createElement('button');
      const focusSpy = vi.spyOn(element, 'focus');
      
      focusElement(element);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should blur element', () => {
      const element = document.createElement('button');
      const blurSpy = vi.spyOn(element, 'blur');
      
      blurElement(element);
      expect(blurSpy).toHaveBeenCalled();
    });

    it('should handle null element gracefully', () => {
      expect(() => focusElement(null)).not.toThrow();
      expect(() => blurElement(null)).not.toThrow();
    });
  });

  describe('Screen reader announcements', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should announce to screen reader', () => {
      announceToScreenReader('Test message');
      
      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test message');
      expect(announcement?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should announce with polite priority', () => {
      announceToScreenReader('Test message', 'polite');
      
      const announcement = document.querySelector('[aria-live]');
      expect(announcement?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Color contrast', () => {
    it('should convert hex to rgb', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('invalid')).toBeNull();
    });

    it('should calculate contrast ratio', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should check accessible contrast', () => {
      expect(isAccessibleContrast('#000000', '#ffffff', 'AA')).toBe(true);
      expect(isAccessibleContrast('#000000', '#ffffff', 'AAA')).toBe(true);
      expect(isAccessibleContrast('#000000', '#000000', 'AA')).toBe(false);
    });
  });

  describe('Keyboard events', () => {
    it('should detect keyboard events', () => {
      expect(isKeyboardEvent({ key: 'Tab' } as KeyboardEvent)).toBe(true);
      expect(isKeyboardEvent({ key: 'Enter' } as KeyboardEvent)).toBe(true);
      expect(isKeyboardEvent({ key: ' ' } as KeyboardEvent)).toBe(true);
      expect(isKeyboardEvent({ key: 'Escape' } as KeyboardEvent)).toBe(true);
      expect(isKeyboardEvent({ key: 'ArrowUp' } as KeyboardEvent)).toBe(true);
      expect(isKeyboardEvent({ key: 'a' } as KeyboardEvent)).toBe(false);
    });

    it('should determine if default should be prevented', () => {
      expect(shouldPreventDefault({ key: ' ' } as KeyboardEvent)).toBe(true);
      expect(shouldPreventDefault({ key: 'Enter' } as KeyboardEvent)).toBe(true);
      expect(shouldPreventDefault({ key: 'ArrowUp' } as KeyboardEvent)).toBe(true);
      expect(shouldPreventDefault({ key: 'Tab' } as KeyboardEvent)).toBe(false);
    });
  });

  describe('Focus visible', () => {
    it('should add focus visible class', () => {
      const element = document.createElement('button');
      addFocusVisibleClass(element);
      expect(element.classList.contains('focus-visible')).toBe(true);
    });

    it('should remove focus visible class', () => {
      const element = document.createElement('button');
      element.classList.add('focus-visible');
      removeFocusVisibleClass(element);
      expect(element.classList.contains('focus-visible')).toBe(false);
    });
  });

  describe('Media queries', () => {
    it('should detect high contrast mode', () => {
      const mockMatchMedia = vi.mocked(window.matchMedia);
      mockMatchMedia.mockReturnValueOnce({
        matches: true,
        media: '(-ms-high-contrast: active)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      expect(isHighContrastMode()).toBe(true);
    });

    it('should detect reduced motion preference', () => {
      const mockMatchMedia = vi.mocked(window.matchMedia);
      mockMatchMedia.mockReturnValueOnce({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should detect screen reader', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 NVDA',
        writable: true,
      });

      expect(isScreenReaderActive()).toBe(true);
    });
  });

  describe('ARIA validation', () => {
    it('should validate ARIA attributes', () => {
      const element = document.createElement('button');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-expanded', 'invalid');
      
      const errors = validateAriaAttributes(element);
      expect(errors).toContain('aria-expanded should be "true" or "false"');
    });

    it('should validate button without label', () => {
      const element = document.createElement('button');
      element.setAttribute('role', 'button');
      
      const errors = validateAriaAttributes(element);
      expect(errors).toContain('Button with role="button" should have aria-label or visible text');
    });

    it('should validate link without label', () => {
      const element = document.createElement('a');
      element.setAttribute('role', 'link');
      
      const errors = validateAriaAttributes(element);
      expect(errors).toContain('Link with role="link" should have aria-label or visible text');
    });
  });
});
