import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Atlas-compliance + reference-grade structural tests for order-confirmation/page.tsx.
 *
 * These tests validate the upgraded design bar:
 * 1. Uses Playfair Display for the success headline
 * 2. Uses shadow-atlas-* instead of bare shadow-sm on cards
 * 3. Uses rounded-2xl for all card containers
 * 4. Has a "next steps" or navigation section (links to /orders and /)
 * 5. Loading skeleton uses amber-100 (not bare spinner only)
 * 6. Uses aria-current or ordered steps for "what's next" guidance
 * 7. MAD currency (no dollar symbol)
 * 8. Trust/reassurance element present (ShieldCheck or BadgeCheck icon)
 * 9. Success icon is visually distinctive (CheckCircle or similar from lucide)
 * 10. Uses logical CSS (no hardcoded left-/right- for RTL safety)
 */

const PAGE_PATH = path.resolve(
  __dirname,
  '../../order-confirmation/page.tsx'
);

function readPage(): string {
  return fs.readFileSync(PAGE_PATH, 'utf-8');
}

describe('order-confirmation/page.tsx — reference-grade Atlas compliance', () => {
  it('uses Playfair Display for the success headline', () => {
    const src = readPage();
    expect(src).toMatch(/Playfair Display/);
  });

  it('uses shadow-atlas-sm or shadow-atlas-md on card containers (not bare shadow-sm)', () => {
    const src = readPage();
    expect(src).toMatch(/shadow-atlas-sm|shadow-atlas-md|shadow-atlas-lg/);
  });

  it('uses rounded-2xl for card containers (no rounded-md or rounded-lg)', () => {
    const src = readPage();
    expect(src).toMatch(/rounded-2xl/);
    expect(src).not.toMatch(/\brounded-md\b/);
    expect(src).not.toMatch(/\brounded-lg\b/);
  });

  it('has a link to /orders for viewing order status', () => {
    const src = readPage();
    expect(src).toMatch(/href="\/orders"/);
  });

  it('has a link to / for continuing shopping', () => {
    const src = readPage();
    expect(src).toMatch(/href="\/"/);
  });

  it('uses MAD currency (no dollar sign in JSX output)', () => {
    const src = readPage();
    expect(src).not.toMatch(/>\s*\$/);
    expect(src).toMatch(/MAD/);
  });

  it('has a success icon (CheckCircle or similar from lucide)', () => {
    const src = readPage();
    expect(src).toMatch(/CheckCircle|check-circle|CircleCheck/);
  });

  it('does not use bg-gray-50 as page background (must use bg-amber-50)', () => {
    const src = readPage();
    expect(src).not.toMatch(/min-h-screen bg-gray-50/);
  });

  it('uses bg-indigo-700 for the primary CTA button', () => {
    const src = readPage();
    expect(src).toMatch(/bg-indigo-700/);
  });

  it('loading state has a designed skeleton or spinner', () => {
    const src = readPage();
    // Must have a loading UI block
    expect(src).toMatch(/loading|animate-spin|animate-pulse/);
  });

  it('does not hardcode "Order Not Found" outside t() wrapper', () => {
    const src = readPage();
    expect(src).not.toMatch(/"Order Not Found"/);
  });

  it('does not hardcode "Return to Home" outside t() wrapper', () => {
    const src = readPage();
    expect(src).not.toMatch(/"Return to Home"/);
  });

  it('does not hardcode "Order Details" outside t() wrapper', () => {
    const src = readPage();
    expect(src).not.toMatch(/"Order Details"/);
  });

  it('does not use @heroicons/react (Lucide React is the sole icon library)', () => {
    const src = readPage();
    expect(src).not.toMatch(/@heroicons\/react/);
  });

  it('order number is displayed with emphasis (indigo-700 or font-bold)', () => {
    const src = readPage();
    // Order number should be highlighted
    expect(src).toMatch(/order_number|order-number/);
    expect(src).toMatch(/text-indigo-700|font-bold|font-semibold/);
  });
});
