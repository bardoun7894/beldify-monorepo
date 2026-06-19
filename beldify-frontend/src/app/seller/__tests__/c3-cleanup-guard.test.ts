// @vitest-environment node
/**
 * TDD — C3: the seller dashboard pages adopt the shared `ui/` primitives and
 * finish the off-palette + RTL + font-heading cleanup.
 *
 * This guard scans the C3-scope seller pages and fails if any of them still:
 *   (a) declare an inline Playfair font object (`const playfair = {...}` or a
 *       `style={{ fontFamily: '... Playfair ...' }}`) instead of the
 *       `font-heading` Tailwind utility,
 *   (b) use an off-palette `blue-*` utility (shipped/approved states must map to
 *       Atlas indigo `info` via the shared status-color constants), or any
 *       hard `green-500` / `red-500` / `purple-*` literal, or
 *   (c) use a physical-direction utility (`text-left`, `text-right`, and the
 *       `ml-/mr-`, `pl-/pr-`, bare `left-/right-` physical variants) instead of
 *       the logical `text-start` / `text-end` / `ms-/me-` / `ps-/pe-` /
 *       `start-/end-` equivalents that read correctly in RTL (ar / ma).
 *
 * Light Atlas tokens only — physical directions break RTL.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SELLER_DIR = join(__dirname, '..'); // src/app/seller

/** The C3-scope pages this pass migrates, plus the regressions it cleans up. */
const C3_PAGES = [
  'products/page.tsx',
  'products/new/page.tsx',
  'products/[id]/edit/page.tsx',
  'store-settings/page.tsx',
  'profile/page.tsx',
  'credits/page.tsx',
  'custom-orders/page.tsx',
  'messages/page.tsx',
  'messages/[buyerId]/page.tsx',
  'earnings/page.tsx',
  'orders/[id]/page.tsx',
  'payouts/page.tsx',
  // Final pass — the two seller FUNNEL pages that bypass the dashboard shell.
  'register/page.tsx',
  'onboarding/page.tsx',
].map((rel) => join(SELLER_DIR, rel));

function read(file: string): string {
  return readFileSync(file, 'utf-8');
}

describe('C3 — seller pages adopt ui/ primitives + finish cleanup', () => {
  it.each(C3_PAGES)('%s declares no inline Playfair font object', (file) => {
    const src = read(file);
    expect(src).not.toMatch(/const\s+playfair\s*=/);
    expect(src).not.toMatch(/Playfair Display/);
  });

  it.each(C3_PAGES)('%s uses no off-palette blue-* utility', (file) => {
    const src = read(file);
    // Match Tailwind blue color utilities: text-blue-600, bg-blue-50, ring-blue-..., etc.
    expect(src).not.toMatch(/\b(?:text|bg|border|ring|from|to|via|fill|stroke|divide)-blue-\d/);
  });

  it.each(C3_PAGES)('%s uses no hard green-500/red-500/purple-* literals', (file) => {
    const src = read(file);
    expect(src).not.toMatch(/\bgreen-500\b/);
    expect(src).not.toMatch(/\bred-500\b/);
    expect(src).not.toMatch(/-purple-\d/);
  });

  it.each(C3_PAGES)('%s uses logical text alignment (no text-left/text-right)', (file) => {
    const src = read(file);
    expect(src).not.toMatch(/\btext-left\b/);
    expect(src).not.toMatch(/\btext-right\b/);
  });
});
