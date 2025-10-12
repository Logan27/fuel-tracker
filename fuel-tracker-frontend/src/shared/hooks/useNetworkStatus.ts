import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastConnected: Date | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsConnected(true);
      setLastConnected(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnected(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status periodically
    const checkConnection = async () => {
      try {
        const response = await fetch('/schema/', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        setIsConnected(response.ok);
        if (response.ok) {
          setLastConnected(new Date());
        }
      } catch {
        setIsConnected(false);
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Initial connection check
    if (isOnline) {
      checkConnection();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return {
    isOnline,
    isConnected,
    lastConnected,
  };
};
