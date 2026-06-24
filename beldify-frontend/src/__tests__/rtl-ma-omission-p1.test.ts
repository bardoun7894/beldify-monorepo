/**
 * P1 RTL regression — Moroccan Darija ('ma') omitted from isRTL checks
 *
 * TDD Red → Green gate.
 *
 * Five pages computed `isRTL = i18n.language === 'ar'` and so 'ma' (Darija)
 * never triggered RTL layout. The fix expands each check to include 'ma':
 *   const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
 *
 * This matches the established pattern in:
 *   - src/app/seller/layout.tsx (line 125)
 *   - src/hooks/useDirection.ts (RTL_LANGUAGES = ['ar','ma'])
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function readSrc(relPath: string): string {
  return readFileSync(join(SRC, relPath), 'utf-8');
}

/** Returns true if the source has the correct dual-language isRTL declaration. */
function hasCorrectIsRTL(source: string): boolean {
  // Accept any form of: i18n.language === 'ar' || i18n.language === 'ma'
  // or vice versa (ma first, then ar) — canonical form is ar first.
  return (
    /i18n\.language\s*===\s*['"]ar['"]\s*\|\|\s*i18n\.language\s*===\s*['"]ma['"]/.test(source) ||
    /i18n\.language\s*===\s*['"]ma['"]\s*\|\|\s*i18n\.language\s*===\s*['"]ar['"]/.test(source)
  );
}

/** Returns true if the source contains the broken single-language form. */
function hasBrokenIsRTL(source: string): boolean {
  // Match: const isRTL = i18n.language === 'ar'; (without a following || 'ma' on same line)
  return /const\s+isRTL\s*=\s*i18n\.language\s*===\s*['"]ar['"];/.test(source);
}

const FILES_IN_SCOPE = [
  'app/checkout/page.tsx',
  'app/category/[slug]/page.tsx',
  'app/seller/register/page.tsx',
  'app/seller/custom-orders/page.tsx',
  'app/custom-orders/new/page.tsx',
];

describe('P1 — isRTL includes Moroccan Darija (ma) in all five pages', () => {
  for (const relPath of FILES_IN_SCOPE) {
    it(`${relPath}: isRTL includes 'ma'`, () => {
      const source = readSrc(relPath);
      expect(
        hasCorrectIsRTL(source),
        `Expected: const isRTL = i18n.language === 'ar' || i18n.language === 'ma';\nActual in ${relPath}: missing 'ma' branch`
      ).toBe(true);
    });

    it(`${relPath}: old single-language form removed`, () => {
      const source = readSrc(relPath);
      expect(
        hasBrokenIsRTL(source),
        `Broken form still present in ${relPath}: const isRTL = i18n.language === 'ar'; (missing 'ma')`
      ).toBe(false);
    });
  }
});

// ── Fix 2: Navbar drawer slides from correct edge in RTL ──────────────────────

describe('P1 — Navbar mobile drawer RTL edge correction', () => {
  const navbarSrc = readSrc('components/layout/Navbar.tsx');

  it('drawer container uses RTL-aware justify alignment (not hardcoded justify-end)', () => {
    // The container div must NOT use a plain static "justify-end" class for the drawer panel.
    // It must use a conditional: isRTL ? 'justify-start' : 'justify-end'
    // We check that the RTL-aware form is present.
    expect(navbarSrc).toMatch(
      /isRTL\s*\?\s*['"]justify-start['"]\s*:\s*['"]justify-end['"]/,
    );
  });

  it('drawer Transition.Child enterFrom uses RTL-mirrored translate (not hardcoded translate-x-full)', () => {
    // enterFrom must be conditional: isRTL ? '-translate-x-full' : 'translate-x-full'
    expect(navbarSrc).toMatch(
      /enterFrom=\{isRTL\s*\?\s*['`]-translate-x-full['`]\s*:\s*['`]translate-x-full['`]\}/,
    );
  });

  it('drawer Transition.Child leaveTo uses RTL-mirrored translate (not hardcoded translate-x-full)', () => {
    // leaveTo must be conditional: isRTL ? '-translate-x-full' : 'translate-x-full'
    expect(navbarSrc).toMatch(
      /leaveTo=\{isRTL\s*\?\s*['`]-translate-x-full['`]\s*:\s*['`]translate-x-full['`]\}/,
    );
  });

  it('hardcoded translate-x-full drawer enterFrom/leaveTo strings are removed', () => {
    // After the fix, the static enterFrom="translate-x-full" on the drawer panel must be gone.
    // (The overlay Transition.Child is allowed to keep it since it fades, no translate.)
    // We check the panel Transition block for the old static string pattern.
    // The panel Transition.Child is identified by being within the drawer panel wrapper.
    // A simple proxy: the literal enterFrom="translate-x-full" must no longer appear.
    expect(navbarSrc).not.toMatch(/enterFrom="translate-x-full"/);
  });
});
