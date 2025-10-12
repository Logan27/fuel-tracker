// Focus indicators and focus management components

import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface FocusIndicatorProps {
  children: ReactNode;
  className?: string;
  focusClassName?: string;
  showOnFocus?: boolean;
}

export const FocusIndicator = ({ 
  children, 
  className, 
  focusClassName = 'ring-2 ring-blue-500 ring-offset-2',
  showOnFocus = true 
}: FocusIndicatorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isFocused && showOnFocus && focusClassName,
        className
      )}
    >
      {children}
    </div>
  );
};

interface FocusTrapProps {
  children: ReactNode;
  className?: string;
  autoFocus?: boolean;
}

export const FocusTrap = ({ children, className, autoFocus = true }: FocusTrapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    firstFocusableRef.current = focusableElements[0];
    lastFocusableRef.current = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableRef.current) {
          event.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableRef.current) {
          event.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Auto focus first element
    if (autoFocus) {
      firstFocusableRef.current?.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

interface FocusVisibleProps {
  children: ReactNode;
  className?: string;
  focusVisibleClassName?: string;
}

export const FocusVisible = ({ 
  children, 
  className, 
  focusVisibleClassName = 'ring-2 ring-blue-500 ring-offset-2' 
}: FocusVisibleProps) => {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleFocus = (event: FocusEvent) => {
      // Check if focus was triggered by keyboard
      if (event.detail === 0) {
        setIsFocusVisible(true);
      }
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        'focus:outline-none',
        isFocusVisible && focusVisibleClassName,
        className
      )}
    >
      {children}
    </div>
  );
};

interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export const SkipLink = ({ href, children, className }: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white',
        'focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2',
        'focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
};

interface FocusScopeProps {
  children: ReactNode;
  className?: string;
  restoreFocus?: boolean;
}

export const FocusScope = ({ children, className, restoreFocus = true }: FocusScopeProps) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  return (
    <div className={className}>
      {children}
    </div>
  );
};
