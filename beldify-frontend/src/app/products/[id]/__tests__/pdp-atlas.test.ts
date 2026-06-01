import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('products/[id]/page.tsx — Atlas visual compliance', () => {
  // ── Loading state ────────────────────────────────────────────────────────────
  it('loading spinner uses Atlas indigo (not plain gray-900)', () => {
    // Must not use bare border-gray-900 on the spinner; should use indigo-700
    expect(pageSrc).not.toMatch(/border-gray-900/);
  });

  // ── Wishlist button — RTL-safe logical positioning ───────────────────────────
  it('wishlist overlay button uses logical end-4 (RTL-safe), not right-4', () => {
    // The absolute-positioned wishlist button on the image must use end-* not right-*
    expect(pageSrc).not.toMatch(/absolute[^"]*right-4/);
    expect(pageSrc).toMatch(/end-4/);
  });

  // ── Card radius ──────────────────────────────────────────────────────────────
  it('info pane uses Atlas card radius (rounded-lg, not rounded-2xl)', () => {
    // The info pane moved from bg-amber-50 to bg-white for separation; rounded-lg stays
    expect(pageSrc).toMatch(/bg-white.*ring-1 ring-amber-200 rounded-lg|bg-white.*shadow-atlas-sm.*rounded-lg/);
  });

  // ── Main image container radius ──────────────────────────────────────────────
  it('main image container uses rounded-lg (Atlas 16px radius)', () => {
    // The image container aspect-[4/5] should use rounded-lg
    expect(pageSrc).toMatch(/aspect-\[4\/5\] rounded-lg/);
  });

  // ── Error state ──────────────────────────────────────────────────────────────
  it('error state uses Atlas rose-700 error token (not red-600)', () => {
    expect(pageSrc).not.toMatch(/text-red-600/);
  });

  // ── Price color ──────────────────────────────────────────────────────────────
  it('display price uses text-indigo-700 for Atlas brand color', () => {
    expect(pageSrc).toContain('text-indigo-700');
  });

  // ── Primary CTA uses indigo-700 (not indigo-600) ─────────────────────────────
  it('Add to bag CTA uses bg-indigo-700 for Atlas primary', () => {
    expect(pageSrc).toContain('bg-indigo-700');
  });

  // ── No broken Tailwind CSS var slash patterns ────────────────────────────────
  it('has no broken hsl(var(--token)/opacity) patterns', () => {
    expect(pageSrc).not.toMatch(/hsl\(var\(--[a-z-]+\)\/[0-9]/);
  });

  // ── Provenance caption uses font-mono ────────────────────────────────────────
  it('renders provenance caption with font-mono as per Atlas spec', () => {
    expect(pageSrc).toContain('font-mono');
  });

  // ── Bespoke section uses indigo-900 background ───────────────────────────────
  it('bespoke strip uses bg-indigo-900', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  // ── Trust pills present ──────────────────────────────────────────────────────
  it('renders all three Atlas trust micro-pill icons', () => {
    expect(pageSrc).toContain('Truck');
    expect(pageSrc).toContain('RotateCcw');
    expect(pageSrc).toContain('ShieldCheck');
  });

  // ── Star ratings use fill-amber-400 ─────────────────────────────────────────
  it('star ratings use fill-amber-400 for Atlas saffron accent', () => {
    expect(pageSrc).toContain('fill-amber-400');
  });

  // ── Mobile sticky bar uses border-amber-100 ─────────────────────────────────
  it('mobile sticky bar uses border-amber-100 as per Atlas spec', () => {
    expect(pageSrc).toContain('border-amber-100');
  });

  // ── No @heroicons imports ────────────────────────────────────────────────────
  it('does not import @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });
});
