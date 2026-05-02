import { useEffect, useState } from 'react';
import { dbService } from '../../../services/db';
import { Geocache } from '../../../types';

export const useOfflineCaches = (noErrorDetail: string) => {
  const [offlineCaches, setOfflineCaches] = useState<Geocache[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadOfflineCaches = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const caches = await dbService.getOfflineCaches();
        if (isCancelled) {
          return;
        }
        setOfflineCaches(caches);
      } catch (error) {
        if (isCancelled) {
          return;
        }
        const message =
          error instanceof Error ? error.message : noErrorDetail;
        setErrorMessage(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOfflineCaches();

    return () => {
      isCancelled = true;
    };
  }, [noErrorDetail]);

  return {
    offlineCaches,
    isLoading,
    errorMessage,
  };
};
