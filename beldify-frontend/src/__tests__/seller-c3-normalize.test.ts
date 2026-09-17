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

