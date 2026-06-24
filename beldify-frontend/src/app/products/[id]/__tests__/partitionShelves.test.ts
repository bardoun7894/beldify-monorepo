/**
 * TDD tests for the partitionShelves helper (Task C — partition correctness)
 *
 * Invariants:
 *  - completeLook ∩ alsoLike = ∅  (shelves never share items)
 *  - When total ≤ 4: completeLook has all items, alsoLike is empty
 *  - When total > 4: completeLook = first 4, alsoLike = rest (up to 8)
 */

import { describe, it, expect } from 'vitest';
import { partitionShelves } from '../partitionShelves';

describe('partitionShelves — disjoint shelves guarantee', () => {
  it('returns two empty arrays when input is empty', () => {
    const { completeLook, alsoLike } = partitionShelves([]);
    expect(completeLook).toHaveLength(0);
    expect(alsoLike).toHaveLength(0);
  });

  it('puts 1 item only in completeLook (no alsoLike shelf)', () => {
    const items = [{ id: '1' }] as any[];
    const { completeLook, alsoLike } = partitionShelves(items);
    expect(completeLook).toHaveLength(1);
    expect(alsoLike).toHaveLength(0);
  });

  it('puts 4 items only in completeLook (no alsoLike shelf)', () => {
    const items = [1, 2, 3, 4].map((n) => ({ id: String(n) })) as any[];
    const { completeLook, alsoLike } = partitionShelves(items);
    expect(completeLook).toHaveLength(4);
    expect(alsoLike).toHaveLength(0);
  });

  it('splits 5 items: 4 completeLook + 1 alsoLike, no overlap', () => {
    const items = [1, 2, 3, 4, 5].map((n) => ({ id: String(n) })) as any[];
    const { completeLook, alsoLike } = partitionShelves(items);
    expect(completeLook).toHaveLength(4);
    expect(alsoLike).toHaveLength(1);
    const clIds = completeLook.map((p) => p.id);
    const alIds = alsoLike.map((p) => p.id);
    expect(clIds.some((id) => alIds.includes(id))).toBe(false);
  });

  it('splits 8 items: 4 + 4, no overlap', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: String(n) })) as any[];
    const { completeLook, alsoLike } = partitionShelves(items);
    expect(completeLook).toHaveLength(4);
    expect(alsoLike).toHaveLength(4);
    const clIds = completeLook.map((p) => p.id);
    const alIds = alsoLike.map((p) => p.id);
    expect(clIds.some((id) => alIds.includes(id))).toBe(false);
  });
});
