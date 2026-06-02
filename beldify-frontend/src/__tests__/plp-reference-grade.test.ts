/**
 * Product listing / search (PLP) — reference-grade pass — TDD red tests.
 *
 * Presentation-only fixes against the impeccable critique:
 *  - RTL-aware mobile filter drawer (logical slide axis)
 *  - .currency-mad wrapper on every MAD price label
 *  - prefers-reduced-motion gating on framer-motion entrance animations
 *  - FilterChips dismiss icon contrast bump (amber-600 -> amber-700)
 *  - ModernFilters confirmed dead code and removed
 *
 * Source-reading tests (Atlas-compliance pattern) — no DOM render needed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const productFilters = readFileSync(join(SRC, 'components/products/ProductFilters.tsx'), 'utf-8');
const productsPage = readFileSync(join(SRC, 'app/products/page.tsx'), 'utf-8');
const filterChips = readFileSync(join(SRC, 'components/products/FilterChips.tsx'), 'utf-8');

// ─── FIX 1: RTL-aware mobile filter drawer ───────────────────────────────────

describe('PLP — mobile filter drawer slides on the logical axis under RTL', () => {
  it('no longer hard-codes the static enterFrom="translate-x-full" attribute', () => {
    // The static string means the drawer always slides from the physical right,
    // wrong-sided under dir=rtl. It must be driven by isRTL instead.
    expect(productFilters).not.toContain('enterFrom="translate-x-full"');
  });

  it('drives the slide direction from isRTL with the negated transform for RTL', () => {
    // dir=rtl is set on <html> (layout.tsx) and inherited by the Headless UI
    // Dialog portal, so `justify-end` already docks the panel on the physical
    // left under RTL. Only the physical CSS transform must flip: RTL slides in
    // from the left edge → -translate-x-full.
    expect(productFilters).toMatch(/isRTL\s*\?\s*['"]-translate-x-full['"]/);
  });

  it('keeps justify-end static (direction-aware) rather than flipping to justify-start', () => {
    // justify-end resolves to the correct physical edge per writing direction;
    // flipping it to justify-start under RTL would wrongly dock on the right.
    expect(productFilters).toContain('flex justify-end');
    expect(productFilters).not.toMatch(/isRTL\s*\?\s*['"]justify-start['"]/);
  });
});

// ─── FIX 2: .currency-mad on every MAD price label ───────────────────────────

describe('PLP — MAD price labels are bidi-isolated with .currency-mad', () => {
  it('wraps the price-range chip label (rendered by FilterChips) with currency-mad', () => {
    // The MAD label is built in products/page.tsx getFilterChips() and rendered
    // by FilterChips; FilterChips is the single DOM render-site that must isolate
    // the price chip so the amount/currency order survives RTL.
    expect(filterChips).toContain('currency-mad');
    expect(filterChips).toMatch(/chip\.type === ['"]price['"]/);
  });

  it('wraps the price-range badge label in ProductFilters.tsx with currency-mad', () => {
    expect(productFilters).toContain('currency-mad');
  });
});

// ─── FIX 3: prefers-reduced-motion gating ────────────────────────────────────

describe('PLP — entrance animations honor prefers-reduced-motion', () => {
  it('imports useReducedMotion from framer-motion', () => {
    expect(productsPage).toContain('useReducedMotion');
  });

  it('conditionalizes the staggered grid delay on reduced motion', () => {
    // The stagger delay must collapse to 0 when reduced motion is requested,
    // not just import the hook unused.
    expect(productsPage).toMatch(/(shouldReduceMotion|prefersReducedMotion)\s*\?\s*0/);
  });
});

// ─── FIX 4: FilterChips dismiss icon contrast ────────────────────────────────

describe('PLP — FilterChips dismiss icon meets a cleaner contrast', () => {
  it('uses text-amber-700 (not the fainter text-amber-600) for the X icon', () => {
    expect(filterChips).not.toContain('text-amber-600');
    expect(filterChips).toContain('text-amber-700');
  });
});

// ─── FIX 5: ModernFilters is dead code and removed ───────────────────────────

describe('PLP — ModernFilters dead component is removed', () => {
  it('the ModernFilters.tsx file no longer exists', () => {
    expect(existsSync(join(SRC, 'components/ui/ModernFilters.tsx'))).toBe(false);
  });

  it('nothing under src references ModernFilters', () => {
    let out = '';
    try {
      out = execSync('grep -rl "ModernFilters" src/ || true', {
        cwd: ROOT,
        encoding: 'utf-8',
      });
    } catch {
      out = '';
    }
    // Allow this test file itself to mention the name in assertions.
    const offenders = out
      .split('\n')
      .filter(Boolean)
      .filter((p) => !p.endsWith('plp-reference-grade.test.ts'));
    expect(offenders).toEqual([]);
  });
});
