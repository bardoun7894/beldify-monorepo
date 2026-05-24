import { cache } from 'react';

// Cache durations in seconds
export const CACHE_DURATIONS = {
  categories: 0, // 15 minutes
  stocks: 300, // 5 minutes
  tailors: 1800, // 30 minutes
  bestSellers: 20, // 15 minutes
  featured: 900, // 15 minutes
  newArrivals: 600, // 10 minutes
  specialOffers: 300, // 5 minutes
} as const;

export type CacheKey = keyof typeof CACHE_DURATIONS;

// Memory cache for server components
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// Server-side cache functions
export const getFromCache = cache(async <T>(key: CacheKey): Promise<T | null> => {
  const cacheEntry = memoryCache.get(key);
  if (!cacheEntry) return null;

  const now = Date.now();
  if (now - cacheEntry.timestamp > CACHE_DURATIONS[key] * 1000) {
    memoryCache.delete(key);
    return null;
  }

  return cacheEntry.data;
});

export const setInCache = async <T>(key: CacheKey, data: T): Promise<void> => {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const removeFromCache = async (key: CacheKey): Promise<void> => {
  memoryCache.delete(key);
};

export const removeManyFromCache = async (keys: CacheKey[]): Promise<void> => {
  keys.forEach((key) => memoryCache.delete(key));
};
