import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export const LoadingButton = ({ 
  isLoading = false, 
  loadingText = 'Loading...', 
  children, 
  disabled,
  ...props 
}: LoadingButtonProps) => {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : children}
    </Button>
  );
};