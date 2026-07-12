'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

export interface StoreType {
  id: number;
  slug: string;
  name: string;
}

interface UseStoreTypesResult {
  storeTypes: StoreType[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the list of store verticals (GET /api/store-types) — e.g.
 * Regular Store, Tailor Store, Men's/Women's Clothing, Jewelry.
 *
 * This answers "what do you sell?" — a question that is independent from
 * `business_type` (legal structure: individual/company/cooperative).
 *
 * Deliberately never falls back to a hardcoded/guessed id on failure: a
 * wrong-but-silent store_type_id is the exact bug this hook exists to kill.
 * Callers must surface `error` and block submission until the seller has
 * explicitly chosen a real store type.
 */
export function useStoreTypes(): UseStoreTypesResult {
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/store-types');
        const raw = response.data?.data ?? response.data;

        if (!Array.isArray(raw)) {
          throw new Error('Unexpected /api/store-types response shape');
        }

        const parsed: StoreType[] = raw
          .map((item: any) => ({
            id: Number(item?.id),
            slug: String(item?.slug ?? ''),
            // Backend sends both `name` (raw English, kept for legacy consumers)
            // and `display_name` (locale-resolved). Always prefer the latter, or
            // Arabic sellers see English labels on an RTL form.
            name: String(
              item?.display_name ?? item?.name ?? item?.localized_name ?? item?.slug ?? ''
            ),
          }))
          .filter((item) => Number.isFinite(item.id) && item.name);

        if (cancelled) return;

        if (parsed.length === 0) {
          throw new Error('Empty /api/store-types response');
        }

        setStoreTypes(parsed);
      } catch (err: any) {
        if (cancelled) return;
        logger.error('Failed to load store types:', {
          status: err?.response?.status,
          message: err?.message,
        });
        setStoreTypes([]);
        setError(err?.message || 'Failed to load store types');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { storeTypes, isLoading, error, refetch };
}
