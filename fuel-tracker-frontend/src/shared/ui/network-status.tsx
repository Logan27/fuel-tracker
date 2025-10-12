import * as React from "react";
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { ConnectionStatus, NetworkErrorState, ServerErrorState } from './error-states';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

interface NetworkStatusProviderProps {
  children: React.ReactNode;
}

export const NetworkStatusProvider = ({ children }: NetworkStatusProviderProps) => {
  const { isOnline, isConnected } = useNetworkStatus();

  const handleRetry = () => {
    window.location.reload();
  };

  // Show network error if offline
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <NetworkErrorState onRetry={handleRetry} />
      </div>
    );
  }

  // Show connection error if online but not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ServerErrorState onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Connection status indicator in corner */}
      <div className="fixed bottom-4 right-4 z-50">
        <ConnectionStatus isOnline={isOnline} isConnected={isConnected} />
      </div>
    </>
  );
};

// Network error banner for inline display
export const NetworkErrorBanner = () => {
  const { isOnline, isConnected } = useNetworkStatus();

  if (isOnline && isConnected) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm text-center">
      <div className="flex items-center justify-center space-x-2">
        <span>
          {!isOnline ? 'No internet connection' : 'Connection issues'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="h-6 px-2 text-destructive-foreground hover:bg-destructive-foreground/20"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
