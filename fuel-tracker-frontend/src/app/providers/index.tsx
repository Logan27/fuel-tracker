import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Toaster } from '@/shared/ui/toaster';
import { Toaster as Sonner } from '@/shared/ui/sonner';
import { NetworkStatusProvider } from '@/shared/ui/network-status';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Композиция всех провайдеров приложения
 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryProvider>
      <TooltipProvider>
        <NetworkStatusProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <Sonner />
          </AuthProvider>
        </NetworkStatusProvider>
      </TooltipProvider>
    </QueryProvider>
  );
};

