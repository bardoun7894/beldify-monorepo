/**
 * TDD tests for RelatedProducts component
 * Task B: showHeading prop + Atlas skeleton + RTL-safe gap
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const src = readFileSync(join(__dirname, '../RelatedProducts.tsx'), 'utf-8');

describe('RelatedProducts — showHeading prop (Task B)', () => {
  it('accepts a showHeading prop in its interface', () => {
    expect(src).toMatch(/showHeading\s*\?/);
  });

  it('renders the heading conditionally based on showHeading prop', () => {
    // Must wrap the h2 in a showHeading conditional
    expect(src).toMatch(/showHeading[^}]*h2|h2[^}]*showHeading|\{.*showHeading.*&&[^}]*<(h2|div)[^>]*>/s);
  });

  it('defaults showHeading to true so cart page behaviour is unchanged', () => {
    // Default assignment: showHeading = true
    expect(src).toMatch(/showHeading\s*=\s*true/);
  });

  it('accepts a products prop for pre-fetched data (render-only mode)', () => {
    expect(src).toMatch(/products\s*\??\s*:/);
  });
});

describe('RelatedProducts — Atlas skeleton (Task B restyle)', () => {
  it('uses amber-100 skeleton backgrounds (Atlas palette) in PDP mode', () => {
    // PDP mode (isPdpMode branch) must use amber-100 skeletons
    expect(src).toContain('bg-amber-100');
  });

  it('uses rounded-2xl on Atlas skeleton cards (PDP mode)', () => {
    // PDP mode skeletons must use Atlas 16px radius
    expect(src).toContain('rounded-2xl');
  });

  it('uses gap-* for product grid and carousel spacing (RTL-safe)', () => {
    // The PDP carousel and grid both use gap-*, not space-x-* for product rows
    expect(src).toMatch(/gap-\d/);
    // space-x-* is acceptable in the heading row of the cart skeleton (preserved)
    // but must not appear in the product grid rows
    expect(src).not.toMatch(/grid[^"]*space-x-\d/s);
  });

  it('preserves original bg-gray-200 skeleton for cart/fetch mode (backward compat)', () => {
    // Cart consumers (isPdpMode = false) must keep the original skeleton
    expect(src).toContain('bg-gray-200');
  });
});

describe('RelatedProducts — mobile snap-scroll (Task B UX)', () => {
  it('adds overflow-x-auto + snap-x for horizontal carousel on mobile', () => {
    expect(src).toContain('overflow-x-auto');
    expect(src).toContain('snap-x');
  });
});
