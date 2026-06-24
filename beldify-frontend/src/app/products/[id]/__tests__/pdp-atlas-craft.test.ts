import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const pagePath = join(__dirname, '../page.tsx');
const pageSrc = readFileSync(pagePath, 'utf-8');
const galleryCssPath = join(__dirname, '../ProductGallery.module.css');

describe('products/[id] — Atlas craft pass (critique fixes)', () => {
  // ── P1: Bespoke-strip CTA must use the accent token, dark-on-amber ──────────
  it('bespoke CTA uses bg-amber-500 with text-amber-950 (WCAG AA dark-on-amber)', () => {
    // The bespoke "Start a tailoring order" link must carry the accent token.
    expect(pageSrc).toMatch(/bg-amber-500[^"]*text-amber-950/);
  });

  it('bespoke CTA keeps dark text on hover (no white-on-amber, hover stays amber-950)', () => {
    // hover:bg-amber-400 is allowed, but text must remain amber-950 — never gray-900 on amber.
    expect(pageSrc).not.toMatch(/bg-amber-400 px-8 py-3 text-sm font-semibold text-gray-900/);
  });

  // ── P2: Dead Swiper CSS module must be removed (drift seed) ──────────────────
  it('ProductGallery.module.css dead-code module is deleted (not imported anywhere)', () => {
    expect(existsSync(galleryCssPath)).toBe(false);
  });

  // ── P2: Bespoke radial-gradient must not carry literal hexes ─────────────────
  it('bespoke decorative gradient uses no hardcoded hex colors (#f59e0b / #3b3b6d)', () => {
    expect(pageSrc).not.toContain('#f59e0b');
    expect(pageSrc).not.toContain('#3b3b6d');
  });

  // ── P2: Add-to-bag indigo divergence is documented, not silent ───────────────
  it('documents indigo-as-PDP-primary CTA as an intentional Atlas exception', () => {
    // A comment must explain the deliberate deviation from the amber add-to-cart contract.
    expect(pageSrc).toMatch(/intentional[^\n]*(indigo|exception)|PDP[^\n]*primary[^\n]*indigo/i);
  });

  // ── P3: Star rating spoken label must agree with rendered fill ───────────────
  it('star aria-label rounds to match the rendered (Math.round) star fill', () => {
    // No raw unrounded rating fed straight into the stars aria-label.
    expect(pageSrc).not.toMatch(/aria-label=\{`\$\{product\.rating\} \$\{t\('product\.stars'/);
  });
});
