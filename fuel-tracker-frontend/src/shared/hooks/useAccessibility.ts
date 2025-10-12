// Accessibility hooks and utilities

import { useState, useEffect, useCallback } from 'react';
import { 
  isScreenReaderActive, 
  isHighContrastMode, 
  prefersReducedMotion,
  announceToScreenReader,
  getContrastRatio,
  isAccessibleContrast
} from '@/shared/lib/accessibility';

// Hook for screen reader detection
export const useScreenReader = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsActive(isScreenReaderActive());
  }, []);

  return isActive;
};

// Hook for high contrast mode detection
export const useHighContrast = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsActive(isHighContrastMode());
  }, []);

  return isActive;
};

// Hook for reduced motion preference
export const useReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    setPrefersReduced(prefersReducedMotion());
  }, []);

  return prefersReduced;
};

// Hook for accessibility announcements
export const useAccessibilityAnnouncements = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  return { announce };
};

// Hook for color contrast testing
export const useColorContrast = (foregroundColor: string, backgroundColor: string) => {
  const [contrastRatio, setContrastRatio] = useState<number>(0);
  const [isAccessible, setIsAccessible] = useState<boolean>(false);

  useEffect(() => {
    const ratio = getContrastRatio(foregroundColor, backgroundColor);
    const accessible = isAccessibleContrast(foregroundColor, backgroundColor);
    
    setContrastRatio(ratio);
    setIsAccessible(accessible);
  }, [foregroundColor, backgroundColor]);

  return { contrastRatio, isAccessible };
};

// Hook for focus management
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const focusElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
      setFocusedElement(element);
    }
  }, []);

  const blurElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.blur();
      setFocusedElement(null);
    }
  }, []);

  const focusNext = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(focusedElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    
    focusElement(focusableElements[nextIndex]);
  }, [focusedElement, focusElement]);

  const focusPrevious = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(focusedElement as HTMLElement);
    const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    
    focusElement(focusableElements[previousIndex]);
  }, [focusedElement, focusElement]);

  return {
    focusedElement,
    focusElement,
    blurElement,
    focusNext,
    focusPrevious
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
};

// Hook for accessibility testing
export const useAccessibilityTesting = () => {
  const [testResults, setTestResults] = useState<{
    errors: string[];
    warnings: string[];
    passed: number;
    total: number;
  }>({
    errors: [],
    warnings: [],
    passed: 0,
    total: 0
  });

  const runTests = useCallback((container: HTMLElement) => {
    const allElements = container.querySelectorAll('*');
    const errors: string[] = [];
    const warnings: string[] = [];
    let passed = 0;

    allElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Check for missing alt text on images
      if (htmlElement.tagName === 'IMG' && !htmlElement.getAttribute('alt')) {
        warnings.push('Image missing alt text');
      }

      // Check for missing labels on form inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(htmlElement.tagName)) {
        const hasLabel = htmlElement.getAttribute('aria-label') || 
                        htmlElement.getAttribute('aria-labelledby') ||
                        htmlElement.closest('label');
        if (!hasLabel) {
          warnings.push('Form input missing label');
        }
      }

      // Check for missing headings
      if (htmlElement.tagName.match(/^H[1-6]$/) && !htmlElement.textContent?.trim()) {
        warnings.push('Heading element is empty');
      }

      // Check for missing ARIA labels on interactive elements
      if (['BUTTON', 'A'].includes(htmlElement.tagName) && 
          !htmlElement.getAttribute('aria-label') && 
          !htmlElement.textContent?.trim()) {
        errors.push('Interactive element missing accessible name');
      }

      // Check for proper ARIA attributes
      const ariaExpanded = htmlElement.getAttribute('aria-expanded');
      if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
        errors.push('aria-expanded should be "true" or "false"');
      }

      const ariaSelected = htmlElement.getAttribute('aria-selected');
      if (ariaSelected && !['true', 'false'].includes(ariaSelected)) {
        errors.push('aria-selected should be "true" or "false"');
      }

      if (errors.length === 0 && warnings.length === 0) {
        passed++;
      }
    });

    setTestResults({
      errors,
      warnings,
      passed,
      total: allElements.length
    });
  }, []);

  return { testResults, runTests };
};

// Hook for accessibility preferences
export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState({
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    keyboardNavigation: false
  });

  useEffect(() => {
    setPreferences({
      screenReader: isScreenReaderActive(),
      highContrast: isHighContrastMode(),
      reducedMotion: prefersReducedMotion(),
      keyboardNavigation: false // Will be set by useKeyboardNavigation
    });
  }, []);

  return preferences;
};
