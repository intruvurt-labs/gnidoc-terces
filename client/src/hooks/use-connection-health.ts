import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface HealthCheck {
  status: string;
  timestamp: string;
  aiServices: {
    gemini: string;
    runway: string;
    imagen: string;
  };
}

export function useConnectionHealth() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: healthData, error: healthError, isLoading } = useQuery<HealthCheck>({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Check every 30 seconds
    retry: 2,
    enabled: isOnline,
  });

  const isHealthy = !healthError && healthData?.status === 'healthy' && isOnline;

  return {
    isHealthy,
    isOnline,
    healthData,
    healthError,
    isLoading,
  };
}
