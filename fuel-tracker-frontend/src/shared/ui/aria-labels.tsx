// ARIA labels and accessibility components

import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface AriaLabelProps {
  children: ReactNode;
  label: string;
  description?: string;
  className?: string;
}

export const AriaLabel = ({ children, label, description, className }: AriaLabelProps) => {
  return (
    <div
      className={cn('sr-only', className)}
      aria-label={label}
      {...(description && { 'aria-describedby': description })}
    >
      {children}
    </div>
  );
};

interface ScreenReaderOnlyProps {
  children: ReactNode;
  className?: string;
}

export const ScreenReaderOnly = ({ children, className }: ScreenReaderOnlyProps) => {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
};

interface VisuallyHiddenProps {
  children: ReactNode;
  className?: string;
}

export const VisuallyHidden = ({ children, className }: VisuallyHiddenProps) => {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
};

interface AriaLiveRegionProps {
  children: ReactNode;
  polite?: boolean;
  atomic?: boolean;
  className?: string;
}

export const AriaLiveRegion = ({ children, polite = false, atomic = true, className }: AriaLiveRegionProps) => {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={polite ? 'polite' : 'assertive'}
      aria-atomic={atomic}
    >
      {children}
    </div>
  );
};

interface AriaDescriptionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AriaDescription = ({ id, children, className }: AriaDescriptionProps) => {
  return (
    <div
      id={id}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
};

interface AriaErrorProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AriaError = ({ id, children, className }: AriaErrorProps) => {
  return (
    <div
      id={id}
      className={cn('text-red-600 text-sm mt-1', className)}
      role="alert"
      aria-live="polite"
    >
      {children}
    </div>
  );
};

interface AriaHelpTextProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AriaHelpText = ({ id, children, className }: AriaHelpTextProps) => {
  return (
    <div
      id={id}
      className={cn('text-gray-600 text-sm mt-1', className)}
    >
      {children}
    </div>
  );
};
