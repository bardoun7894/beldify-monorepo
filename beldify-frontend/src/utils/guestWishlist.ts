/**
 * guestWishlist — localStorage-backed helpers for unauthenticated wishlist state.
 *
 * All functions guard against SSR (typeof window check) so they are safe to
 * import from server components and during hydration.
 *
 * Storage key: 'guest_wishlist'
 * Format: JSON-serialised array of WishlistItem-shaped objects.
 *
 * Guest items use the product_id as the synthetic `id` field because there is
 * no server row. The shape must be compatible with WishlistItem so the wishlist
 * page renders without modification.
 */

const STORAGE_KEY = 'guest_wishlist';

export interface GuestWishlistProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  discount_percentage: number;
  variants: {
    size: string;
    color: string;
    style: string;
  };
}

export interface GuestWishlistItem {
  /** Synthetic id — equals product_id for guest items (no server row). */
  id: number;
  product_id: number;
  product: GuestWishlistProduct;
  /**
   * Notify flags — stored when a guest sets them via NotifyMeButton.
   * Forwarded verbatim on merge so the trigger is not silently killed.
   */
  notify_back_in_stock?: boolean;
  notify_price_drop?: boolean;
  /** Target price for price-drop alerts (stored if guest sets one). */
  target_price?: number | null;
}

/**
 * Returns the current guest wishlist from localStorage.
 * Returns an empty array when localStorage is unavailable or the stored
 * value is invalid JSON.
 */
export function getGuestWishlist(): GuestWishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuestWishlistItem[];
  } catch {
    return [];
  }
}

/**
 * Adds an item to the guest wishlist, ignoring duplicates (same product_id).
 */
export function addGuestWishlistItem(item: GuestWishlistItem): void {
  if (typeof window === 'undefined') return;
  const current = getGuestWishlist();
  if (current.some((i) => i.product_id === item.product_id)) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, item]));
  } catch {
    // Quota exceeded or private mode — silently ignore
  }
}

/**
 * Removes the item with the given product_id from the guest wishlist.
 * No-op if the product is not in the list.
 */
export function removeGuestWishlistItem(productId: number): void {
  if (typeof window === 'undefined') return;
  const current = getGuestWishlist();
  const updated = current.filter((i) => i.product_id !== productId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Quota exceeded or private mode — silently ignore
  }
}

/**
 * Clears all items from the guest wishlist.
 */
export function clearGuestWishlist(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage blocked — silently ignore
  }
}

/**
 * Returns an array of product_ids currently in the guest wishlist.
 */
export function getGuestWishlistProductIds(): number[] {
  return getGuestWishlist().map((i) => i.product_id);
}
