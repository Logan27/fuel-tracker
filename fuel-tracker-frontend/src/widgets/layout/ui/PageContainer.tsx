import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export const PageContainer = ({
  children,
  className,
  maxWidth = 'full',
}: PageContainerProps) => {
  return (
    <div
      className={cn(
        'container mx-auto px-4 py-8',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};

