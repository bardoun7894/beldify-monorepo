/**
 * recentlyViewed — localStorage-backed helpers for recently-viewed product tracking.
 *
 * All functions guard against SSR (typeof window check) so they are safe to
 * import from server components and during hydration.
 *
 * Storage key: 'beldify_recently_viewed'
 * Format: JSON-serialised array of RecentlyViewedItem, newest first.
 * Capped at MAX_ITEMS (12).
 */

export const STORAGE_KEY = 'beldify_recently_viewed';
export const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  id: number;
  name: string;
  image: string;
  price: number;
  viewedAt: number;
}

/**
 * Returns the current recently-viewed list from localStorage.
 * Returns an empty array when localStorage is unavailable or the stored
 * value is invalid JSON.
 */
export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentlyViewedItem[];
  } catch {
    return [];
  }
}

/**
 * Prepends the item to the recently-viewed list.
 * If an item with the same id already exists it is removed first (dedupe).
 * List is capped at MAX_ITEMS — oldest entries are dropped.
 */
export function addRecentlyViewed(item: RecentlyViewedItem): void {
  if (typeof window === 'undefined') return;
  const current = getRecentlyViewed().filter((i) => i.id !== item.id);
  const updated = [item, ...current].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Quota exceeded or private mode — silently ignore
  }
}

/**
 * Clears all items from the recently-viewed list.
 */
export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage blocked — silently ignore
  }
}
