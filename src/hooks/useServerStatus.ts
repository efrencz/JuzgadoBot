import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../config/constants';

export const useServerStatus = () => {
  const [isServerAvailable, setIsServerAvailable] = useState(false);

  const checkServer = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsServerAvailable(response.ok);
    } catch {
      setIsServerAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, [checkServer]);

  return isServerAvailable;
};