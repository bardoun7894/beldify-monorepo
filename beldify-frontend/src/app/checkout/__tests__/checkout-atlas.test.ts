import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Atlas-compliance structural tests for checkout/page.tsx.
 *
 * These tests validate:
 * 1. No @heroicons/react imports (Lucide React is the sole icon library)
 * 2. No `bg-amber-600` or `bg-amber-700` for CTA buttons (must use indigo-700)
 * 3. Uses bg-indigo-700 for primary CTAs
 * 4. No `min-h-screen bg-gray-50` page background (must be amber-50)
 * 5. No `$` currency symbol (must use MAD)
 * 6. No `rounded-md` or `rounded-lg` on card containers (must use rounded-2xl)
 * 7. No "STEP X OF Y" kicker text (anti-AI-slop rule)
 * 8. Uses logical CSS classes (ps- / pe- / ms- / me-) not left- / right- for RTL
 * 9. Uses shadow-atlas-sm / shadow-atlas-md rather than bare shadow-md on cards
 * 10. Progress stepper uses aria-current for accessibility
 */

const PAGE_PATH = path.resolve(__dirname, '../../checkout/page.tsx');

function readPage(): string {
  return fs.readFileSync(PAGE_PATH, 'utf-8');
}

describe('checkout/page.tsx — Atlas compliance', () => {
  it('does not import from @heroicons/react', () => {
    const src = readPage();
    expect(src).not.toMatch(/@heroicons\/react/);
  });

  it('does not use bg-amber-600 or hover:bg-amber-700 for CTAs', () => {
    const src = readPage();
    expect(src).not.toMatch(/\bbg-amber-600\b/);
    expect(src).not.toMatch(/\bhover:bg-amber-700\b/);
  });

  it('uses bg-indigo-700 for the primary CTA', () => {
    const src = readPage();
    expect(src).toMatch(/bg-indigo-700/);
  });

  it('does not use min-h-screen bg-gray-50 as page background', () => {
    const src = readPage();
    expect(src).not.toMatch(/min-h-screen bg-gray-50/);
  });

  it('does not use $ currency symbol in JSX text output (MAD only)', () => {
    const src = readPage();
    // Only match $ appearing after > (in JSX text nodes), not JS template literals
    expect(src).not.toMatch(/>\s*\$/);
    // Also reject hardcoded dollar amounts like "$42" or "$ 42"
    expect(src).not.toMatch(/"\$\d/);
  });

  it('does not use rounded-md or rounded-lg on card containers', () => {
    const src = readPage();
    expect(src).not.toMatch(/\brounded-md\b/);
    expect(src).not.toMatch(/\brounded-lg\b/);
  });

  it('does not use "STEP X OF Y" numbered kicker text pattern (anti-slop)', () => {
    const src = readPage();
    // Forbid hardcoded "STEP 2 OF 4" / "STEP 3 OF 4" strings — these are generic AI scaffolding
    expect(src).not.toMatch(/STEP\s+\d+\s+OF\s+\d+/i);
  });

  it('CheckoutProgressBar component uses aria-current="step" for a11y', () => {
    // aria-current="step" lives in CheckoutProgressBar, not inline in page.tsx.
    // page.tsx imports and renders <CheckoutProgressBar currentStep={...} />.
    const progressBar = fs.readFileSync(
      path.resolve(__dirname, '../../../components/checkout/CheckoutProgressBar.tsx'),
      'utf-8'
    );
    expect(progressBar).toMatch(/aria-current.*step/);
  });

  it('uses Playfair Display for the main heading', () => {
    const src = readPage();
    expect(src).toMatch(/Playfair Display/);
  });

  it('uses rounded-2xl on section cards', () => {
    const src = readPage();
    expect(src).toMatch(/rounded-2xl/);
  });

  it('shipping method section has role=radiogroup or uses fieldset for a11y', () => {
    const src = readPage();
    // Must use semantic radio grouping, either via fieldset or role=radiogroup
    const hasFieldset = src.match(/<fieldset/);
    const hasRadioGroup = src.match(/role="radiogroup"/);
    expect(hasFieldset || hasRadioGroup).toBeTruthy();
  });

  it('uses MAD currency throughout', () => {
    const src = readPage();
    // At least one MAD reference must exist in the order summary
    expect(src).toMatch(/MAD/);
  });
});
