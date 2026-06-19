/**
 * TDD — C3: adopt primitives + fix RTL / off-palette across seller pages.
 *
 * Source-reading assertions (the dominant pattern for Atlas-compliance tests).
 * Covers:
 *  - shared status-color maps extracted to src/constants/*
 *  - off-palette blue-* gone from seller status badges (→ indigo `info`)
 *  - LTR table utils (text-left/text-right) replaced with logical text-start/text-end
 *  - MAD price columns carry tabular-nums + .currency-mad
 *  - headings routed through the font-heading utility (no inline Playfair object)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..');
const r = (p: string) => readFileSync(join(SRC, p), 'utf-8');

// ── Shared status-color constants ────────────────────────────────────────────
describe('C3 — shared status-color maps', () => {
  it('orderStatusColors.ts exists and exports a status→variant map', () => {
    const p = join(SRC, 'constants/orderStatusColors.ts');
    expect(existsSync(p)).toBe(true);
    const c = readFileSync(p, 'utf-8');
    expect(c).toMatch(/shipped/);
    expect(c).toMatch(/delivered/);
    // shipped must NOT use a blue color class — it maps to the indigo `info` variant
    expect(c).not.toMatch(/bg-blue-|text-blue-/);
    expect(c).toMatch(/info|indigo/);
  });

  it('payoutStatusColors.ts exists and maps approved off blue', () => {
    const p = join(SRC, 'constants/payoutStatusColors.ts');
    expect(existsSync(p)).toBe(true);
    const c = readFileSync(p, 'utf-8');
    expect(c).toMatch(/approved/);
    expect(c).toMatch(/paid/);
    expect(c).not.toMatch(/bg-blue-|text-blue-/);
  });
});

// ── Off-palette blue gone ─────────────────────────────────────────────────────
describe('C3 — no off-palette blue in migrated seller pages', () => {
  const migrated = [
    'app/seller/page.tsx',
    'app/seller/orders/page.tsx',
    'app/seller/orders/[id]/page.tsx',
    'app/seller/payouts/page.tsx',
  ];
  for (const f of migrated) {
    it(`${f} uses no blue-* utility classes`, () => {
      expect(r(f)).not.toMatch(/\bbg-blue-|\btext-blue-|\bring-blue-/);
    });
  }
});

// ── Logical alignment, no LTR table utils ─────────────────────────────────────
describe('C3 — logical (RTL-safe) table alignment', () => {
  const migrated = [
    'app/seller/page.tsx',
    'app/seller/orders/page.tsx',
  ];
  for (const f of migrated) {
    it(`${f} uses no text-left / text-right`, () => {
      expect(r(f)).not.toMatch(/\btext-left\b|\btext-right\b/);
    });
    it(`${f} adopts the Table primitive (logical alignment lives there)`, () => {
      const c = r(f);
      // Either logical utilities directly OR the shared Table primitive which owns them.
      expect(c).toMatch(/text-start|text-end|from '@\/components\/ui\/table'/);
      expect(c).toMatch(/TableHead|TableCell/);
    });
  }
});

// The Table primitive is the single owner of logical alignment + tabular-nums.
describe('C3 — Table primitive owns logical alignment', () => {
  it('table.tsx defaults to text-start and exposes numeric → text-end tabular-nums', () => {
    const c = readFileSync(join(SRC, 'components/ui/table.tsx'), 'utf-8');
    expect(c).toMatch(/text-start/);
    expect(c).toMatch(/text-end/);
    expect(c).toMatch(/tabular-nums/);
    expect(c).not.toMatch(/\btext-left\b|\btext-right\b/);
  });
});

// ── MAD price columns ─────────────────────────────────────────────────────────
describe('C3 — MAD price columns are tabular + LTR-safe', () => {
  it('seller dashboard total column uses numeric cells and currency-mad', () => {
    const c = r('app/seller/page.tsx');
    expect(c).toMatch(/numeric/);
    expect(c).toMatch(/currency-mad/);
  });
  it('orders list total column uses numeric cells and currency-mad', () => {
    const c = r('app/seller/orders/page.tsx');
    expect(c).toMatch(/numeric/);
    expect(c).toMatch(/currency-mad/);
  });
});

// ── font-heading utility, no inline Playfair object on migrated pages ─────────
describe('C3 — headings routed through the font-heading utility', () => {
  const migrated = [
    'app/seller/page.tsx',
    'app/seller/orders/page.tsx',
    'app/seller/payouts/page.tsx',
  ];
  for (const f of migrated) {
    it(`${f} uses font-heading and drops the inline Playfair object`, () => {
      const c = r(f);
      expect(c).toMatch(/font-heading/);
      expect(c).not.toMatch(/fontFamily:\s*'"Playfair Display"/);
    });
  }
});
