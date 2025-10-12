import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { useTouchDevice } from "../hooks/useResponsive";

// Touch-friendly button with larger touch targets
interface TouchFriendlyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

export const TouchFriendlyButton = React.forwardRef<HTMLButtonElement, TouchFriendlyButtonProps>(
  ({ children, size = 'md', variant = 'default', className, ...props }, ref) => {
    const isTouchDevice = useTouchDevice();

    const sizeClasses = {
      sm: isTouchDevice ? 'h-12 px-4 text-sm' : 'h-9 px-3 text-sm',
      md: isTouchDevice ? 'h-14 px-6 text-base' : 'h-10 px-4 text-sm',
      lg: isTouchDevice ? 'h-16 px-8 text-lg' : 'h-11 px-8 text-sm',
    };

    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TouchFriendlyButton.displayName = "TouchFriendlyButton";

// Touch-friendly input with larger touch targets
interface TouchFriendlyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TouchFriendlyInput = React.forwardRef<HTMLInputElement, TouchFriendlyInputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    const isTouchDevice = useTouchDevice();

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            isTouchDevice ? 'h-12 text-base' : 'h-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
TouchFriendlyInput.displayName = "TouchFriendlyInput";

// Touch-friendly card with larger touch targets
interface TouchFriendlyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  clickable?: boolean;
  onClick?: () => void;
}

export const TouchFriendlyCard = React.forwardRef<HTMLDivElement, TouchFriendlyCardProps>(
  ({ children, clickable = false, onClick, className, ...props }, ref) => {
    const isTouchDevice = useTouchDevice();

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          clickable && 'cursor-pointer hover:shadow-md transition-shadow',
          isTouchDevice && clickable && 'active:scale-95 transition-transform',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TouchFriendlyCard.displayName = "TouchFriendlyCard";

// Touch-friendly list item
interface TouchFriendlyListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  clickable?: boolean;
  onClick?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TouchFriendlyListItem = React.forwardRef<HTMLDivElement, TouchFriendlyListItemProps>(
  ({ children, clickable = false, onClick, leftIcon, rightIcon, className, ...props }, ref) => {
    const isTouchDevice = useTouchDevice();

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 px-4 py-3 border-b last:border-b-0',
          clickable && 'cursor-pointer hover:bg-muted/50 transition-colors',
          isTouchDevice && clickable && 'active:bg-muted',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {leftIcon && (
          <div className="flex-shrink-0">
            {leftIcon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {rightIcon && (
          <div className="flex-shrink-0">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
TouchFriendlyListItem.displayName = "TouchFriendlyListItem";

// Touch-friendly spacing utility
export const TouchFriendlySpacing = ({ children }: { children: React.ReactNode }) => {
  const isTouchDevice = useTouchDevice();

  return (
    <div className={cn(
      'space-y-4',
      isTouchDevice && 'space-y-6'
    )}>
      {children}
    </div>
  );
};
