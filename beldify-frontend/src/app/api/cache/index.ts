const cache = new Map<string, { data: unknown; timestamp: number }>();

const DEFAULT_TTL = 300_000; // 5 minutes in ms

export async function getCache(key: string): Promise<unknown | null> {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export async function setCache(key: string, data: unknown): Promise<void> {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function clearCache(key: string): Promise<void> {
  cache.delete(key);
}

export async function clearAllCache(): Promise<boolean> {
  try {
    cache.clear();
    return true;
  } catch {
    return false;
  }
}
