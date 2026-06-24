import { Product } from '@/lib/types';

interface ShelfPartition {
  /** First up to 4 items — rendered in the "Complete the look" shelf. */
  completeLook: Product[];
  /**
   * Next up to 4 items (indices 4–7) — rendered in "You might also like".
   * Empty when the input has ≤ 4 items so only one shelf is ever shown.
   */
  alsoLike: Product[];
}

/**
 * Splits a flat list of related products into two disjoint shelf slices.
 *
 * Invariants guaranteed by this function:
 *  1. completeLook ∩ alsoLike = ∅   (no item appears in both shelves)
 *  2. When total ≤ 4: completeLook = all items, alsoLike = []
 *     (prevents duplicate / near-duplicate shelves on low-inventory PDP)
 *  3. When total  > 4: completeLook = first 4, alsoLike = items 4..7
 */
export function partitionShelves(products: Product[]): ShelfPartition {
  if (products.length <= 4) {
    return { completeLook: products.slice(), alsoLike: [] };
  }
  return {
    completeLook: products.slice(0, 4),
    alsoLike: products.slice(4, 8),
  };
}
