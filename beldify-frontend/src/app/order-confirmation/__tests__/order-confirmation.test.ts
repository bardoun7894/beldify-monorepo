import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Atlas-compliance structural tests for order-confirmation/page.tsx.
 *
 * These tests validate:
 * 1. No @heroicons/react imports (Lucide React is the sole icon library)
 * 2. No `bg-amber-600` / `bg-amber-700` on CTA buttons (must be indigo-700 / indigo-800)
 * 3. No `bg-gray-50` page background (must be bg-amber-50)
 * 4. No `$` currency symbol (MAD is used)
 * 5. No hardcoded English strings outside t() calls
 * 6. No `rounded-md` or `rounded-lg` on card containers (must be rounded-2xl)
 *
 * These tests MUST FAIL before the Atlas migration and PASS after.
 */

const PAGE_PATH = path.resolve(
  __dirname,
  '../../order-confirmation/page.tsx'
);

function readPage(): string {
  return fs.readFileSync(PAGE_PATH, 'utf-8');
}

describe('order-confirmation/page.tsx — Atlas compliance', () => {
  it('does not import from @heroicons/react', () => {
    const src = readPage();
    expect(src).not.toMatch(/@heroicons\/react/);
  });

  it('does not use bg-amber-600 or bg-amber-700 for CTAs (must use indigo-700 / indigo-800)', () => {
    const src = readPage();
    // CTA buttons must be bg-indigo-700, not amber (amber is reserved for accent surfaces)
    // We check that bg-amber-600 and bg-amber-700 do NOT appear on Link/button elements
    // Simplified: check they don't appear at all in the page (amber-600/700 are wrong CTA tones)
    expect(src).not.toMatch(/bg-amber-600/);
    expect(src).not.toMatch(/hover:bg-amber-700/);
  });

  it('uses bg-indigo-700 for the primary CTA', () => {
    const src = readPage();
    expect(src).toMatch(/bg-indigo-700/);
  });

  it('does not use bg-gray-50 as page background (must use bg-amber-50)', () => {
    const src = readPage();
    // The main page wrapper must not use bare gray-50
    expect(src).not.toMatch(/min-h-screen bg-gray-50/);
  });

  it('does not use $ currency symbol (must use MAD)', () => {
    const src = readPage();
    // Dollar sign in JSX output means wrong currency
    expect(src).not.toMatch(/>\s*\$/);
    expect(src).not.toMatch(/`\$/);
  });

  it('does not use rounded-md or rounded-lg on card containers', () => {
    const src = readPage();
    // Cards and containers must use rounded-2xl per DESIGN.md §4
    expect(src).not.toMatch(/rounded-md/);
    expect(src).not.toMatch(/rounded-lg/);
  });

  it('wraps "Order Not Found" through t()', () => {
    const src = readPage();
    // Hardcoded string must not appear in JSX — must be inside t()
    expect(src).not.toMatch(/"Order Not Found"/);
  });

  it('wraps "Return to Home" through t()', () => {
    const src = readPage();
    expect(src).not.toMatch(/"Return to Home"/);
  });

  it('wraps "Order Details" through t()', () => {
    const src = readPage();
    expect(src).not.toMatch(/"Order Details"/);
  });

  it('wraps "Shipping Address:" through t()', () => {
    const src = readPage();
    expect(src).not.toMatch(/"Shipping Address:"/);
  });

  it('wraps "View Order Status" through t()', () => {
    const src = readPage();
    expect(src).not.toMatch(/"View Order Status"/);
  });

  it('wraps "Continue Shopping" through t()', () => {
    const src = readPage();
    expect(src).not.toMatch(/"Continue Shopping"/);
  });
});
