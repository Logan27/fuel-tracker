// Accessibility utilities and helpers

// ARIA attributes helpers
export const getAriaLabel = (label: string, description?: string) => ({
  'aria-label': label,
  ...(description && { 'aria-describedby': description }),
});

export const getAriaExpanded = (expanded: boolean) => ({
  'aria-expanded': expanded,
});

export const getAriaSelected = (selected: boolean) => ({
  'aria-selected': selected,
});

export const getAriaChecked = (checked: boolean) => ({
  'aria-checked': checked,
});

export const getAriaPressed = (pressed: boolean) => ({
  'aria-pressed': pressed,
});

export const getAriaHidden = (hidden: boolean) => ({
  'aria-hidden': hidden,
});

export const getAriaLive = (polite: boolean = false) => ({
  'aria-live': polite ? 'polite' : 'assertive',
});

export const getAriaAtomic = (atomic: boolean = true) => ({
  'aria-atomic': atomic,
});

// Role helpers
export const getRole = (role: string) => ({ role });

// Tabindex helpers
export const getTabIndex = (index: number | 'auto' | 'none') => {
  if (index === 'auto') return { tabIndex: 0 };
  if (index === 'none') return { tabIndex: -1 };
  return { tabIndex: index };
};

// Focus management helpers
export const focusElement = (element: HTMLElement | null) => {
  if (element) {
    element.focus();
  }
};

export const blurElement = (element: HTMLElement | null) => {
  if (element) {
    element.blur();
  }
};

// Screen reader helpers
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Color contrast helpers
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const isAccessibleContrast = (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// Keyboard navigation helpers
export const isKeyboardEvent = (event: KeyboardEvent): boolean => {
  return event.key === 'Tab' || 
         event.key === 'Enter' || 
         event.key === ' ' || 
         event.key === 'Escape' ||
         event.key.startsWith('Arrow');
};

export const shouldPreventDefault = (event: KeyboardEvent): boolean => {
  return event.key === ' ' || 
         event.key === 'Enter' || 
         event.key.startsWith('Arrow');
};

// Focus visible helpers
export const addFocusVisibleClass = (element: HTMLElement) => {
  element.classList.add('focus-visible');
};

export const removeFocusVisibleClass = (element: HTMLElement) => {
  element.classList.remove('focus-visible');
};

// High contrast mode detection
export const isHighContrastMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Windows High Contrast Mode
  if (window.matchMedia('(-ms-high-contrast: active)').matches) {
    return true;
  }
  
  // Check for forced colors
  if (window.matchMedia('(forced-colors: active)').matches) {
    return true;
  }
  
  return false;
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Screen reader detection (basic)
export const isScreenReaderActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for common screen reader indicators
  return (
    window.navigator.userAgent.includes('NVDA') ||
    window.navigator.userAgent.includes('JAWS') ||
    window.navigator.userAgent.includes('VoiceOver') ||
    window.navigator.userAgent.includes('TalkBack')
  );
};

// Accessibility testing helpers
export const validateAriaAttributes = (element: HTMLElement): string[] => {
  const errors: string[] = [];
  
  // Check for required ARIA attributes
  if (element.getAttribute('role') === 'button' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
    errors.push('Button with role="button" should have aria-label or visible text');
  }
  
  if (element.getAttribute('role') === 'link' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
    errors.push('Link with role="link" should have aria-label or visible text');
  }
  
  // Check for invalid ARIA attributes
  const ariaExpanded = element.getAttribute('aria-expanded');
  if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
    errors.push('aria-expanded should be "true" or "false"');
  }
  
  const ariaSelected = element.getAttribute('aria-selected');
  if (ariaSelected && !['true', 'false'].includes(ariaSelected)) {
    errors.push('aria-selected should be "true" or "false"');
  }
  
  return errors;
};
