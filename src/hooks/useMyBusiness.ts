import { useCallback, useEffect, useState } from 'react';
import type { Business } from '../types';
import { businessService } from '../services/businessService';
import { useAuth } from './useAuth';

export function useMyBusiness() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setError(false);
    setBusiness(undefined);
    try {
      const result = await businessService.getByOwner(profile.id);
      setBusiness(result);
    } catch {
      setError(true);
      setBusiness(null);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  return { business, loading: business === undefined, error, refresh: load };
}
