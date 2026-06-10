/**
 * verticalDetection — client-side jewelry detection from PDP payload
 *
 * Detection precedence (first match wins):
 * 1. product.vertical === 'jewelry'
 * 2. product.category_slug === 'jewelry'
 * 3. product.category matches /jewel/i
 * 4. product.customization_options has 'material' key  (jewelry-vertical-specific spec field)
 *
 * All checks are null-safe. Returns false for empty / undefined inputs.
 */

export type ProductVerticalHint = {
  vertical?: string | null;
  category?: string | null;
  category_slug?: string | null;
  customization_options?: Record<string, unknown> | null;
  [key: string]: unknown;
};

/**
 * Returns true when the product payload indicates a jewelry vertical product.
 *
 * Used in the PDP to swap clothing-specific UI for jewelry-specific UI:
 *   - Hides tailoring bespoke strip, clothing size selectors, fabric picker
 *   - Shows JewelryFields spec block
 *   - Shows ring-size chip label instead of generic "Size"
 *   - Shows jewelry custom-order bespoke section
 */
export function isJewelryProduct(product: ProductVerticalHint): boolean {
  if (!product) return false;

  // 1. Explicit vertical field from backend (most reliable)
  if (product.vertical === 'jewelry') return true;

  // 2. Category slug (set by backend, stable identifier)
  if (
    typeof product.category_slug === 'string' &&
    product.category_slug.toLowerCase() === 'jewelry'
  ) {
    return true;
  }

  // 3. Category display name (loose match, handles localized values)
  if (
    typeof product.category === 'string' &&
    /jewel/i.test(product.category)
  ) {
    return true;
  }

  // 4. Presence of jewelry-specific spec keys (material key from Verticals::JEWELRY_FIELDS)
  //    — last resort when vertical/category fields are not populated
  if (
    product.customization_options &&
    typeof product.customization_options === 'object' &&
    'material' in product.customization_options
  ) {
    return true;
  }

  return false;
}

/**
 * Returns true when all variant size names are numeric ring-size codes
 * (e.g. "48", "50", "52", "54", "56", "58", "60" — European ring sizes).
 * A size name is considered a ring size if it is a positive integer in [40..75].
 */
export function hasRingSizes(sizeNames: string[]): boolean {
  if (!sizeNames || sizeNames.length === 0) return false;
  return sizeNames.every((name) => {
    const n = parseInt(name, 10);
    return !isNaN(n) && n >= 40 && n <= 75 && String(n) === name.trim();
  });
}
