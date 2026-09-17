/**
 * home-hardcoded-strings — TDD Red-Green gate
 *
 * Verifies that all previously-hardcoded UI strings in HomeContent.tsx
 * are now routed through t() calls rather than rendered as bare literals.
 *
 * Sections covered:
 *   1. Special offers festive card (Arabic title + description)
 *   2. Tailoring CTA badge (Arabic label)
 *   3. Ateliers rail heading (Arabic) + Verified badge
 *   4. Journal section heading (Arabic)
 *
 * Also verifies that the four keys used-with-fallback but missing from
 * en.json are called with a two-argument t() form so they gracefully
 * degrade to their English fallback string.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const homeContent = readFileSync(
  join(ROOT, 'src/components/home/HomeContent.tsx'),
  'utf-8',
);

// ─── 1. No bare hardcoded Arabic/English visible strings ─────────────────────

describe('HomeContent — no bare hardcoded visible strings', () => {
  it('has no hardcoded Arabic festive card title (كوليكسيون المناسبات)', () => {
    // Must be wrapped in t() — we allow it inside a t() fallback string
    // but NOT as a raw JSX text node outside t()
    const raw = homeContent;
    // The raw Arabic text should not appear outside a t() call.
    // We detect this by checking the string does not appear as JSX text.
    // Allow it inside a JS string within t('key', '...fallback...') only.
    const jsxTextRegex = />\s*كوليكسيون المناسبات\s*</;
    expect(raw).not.toMatch(jsxTextRegex);
  });

  it('has no hardcoded Arabic festive card description outside t()', () => {
    const jsxTextRegex = />\s*قفاطين وتكاشط للأعراس/;
    expect(homeContent).not.toMatch(jsxTextRegex);
  });

  it('has no hardcoded Arabic tailoring badge label outside t()', () => {
    const jsxTextRegex = />\s*خياطة على القياس\s*</;
    expect(homeContent).not.toMatch(jsxTextRegex);
  });

  it('has no hardcoded Arabic ateliers heading outside t()', () => {
    // The heading "ورشات مختارة" must not be a bare JSX text node
    const jsxTextRegex = />\s*ورشات مختارة\s*</;
    expect(homeContent).not.toMatch(jsxTextRegex);
  });

  it('has no hardcoded "Verified" badge text outside t()', () => {
    // "Verified" must not appear as bare JSX text — must be inside t()
    const jsxTextRegex = />\s*Verified\s*</;
    expect(homeContent).not.toMatch(jsxTextRegex);
  });

  it('has no hardcoded Arabic journal heading outside t()', () => {
    const jsxTextRegex = />\s*المجلة\s*</;
    expect(homeContent).not.toMatch(jsxTextRegex);
  });
});

// ─── 2. Keys-with-fallback: missing keys must be referenced with a fallback ───
//
// Some keys are used in a data-driven map pattern:
//   { labelKey: 'home.trust.free_delivery', labelFallback: '...' }
//   ...
//   t(labelKey, labelFallback)
// In those cases the key string appears as a quoted literal in the data array,
// and the t() call itself uses variable names. Both patterns are valid; we just
// verify the key string is present in the file.

describe('HomeContent — missing keys referenced with fallback', () => {
  it("references 'home.categories.rail_label' with a fallback in t() or aria-label", () => {
    // Inline form: t('home.categories.rail_label', 'some fallback')
    expect(homeContent).toMatch(/t\(\s*['"]home\.categories\.rail_label['"]\s*,/);
  });

  it("references 'home.trust.label' with a fallback", () => {
    expect(homeContent).toMatch(/t\(\s*['"]home\.trust\.label['"]\s*,/);
  });

  it("references 'home.trust.free_delivery' somewhere in the file as a string literal", () => {
    // May be in a data array (labelKey: 'home.trust.free_delivery') with separate t(labelKey, labelFallback)
    expect(homeContent).toMatch(/['"]home\.trust\.free_delivery['"]/);
  });

  it("references 'home.seller.stat_sellers_value' with a fallback in t()", () => {
    expect(homeContent).toMatch(/t\(\s*['"]home\.seller\.stat_sellers_value['"]\s*,/);
  });
});

// ─── 3. Keys that DO exist in en.json must be used (single-arg t() fine) ─────

describe('HomeContent — existing keys are actually called', () => {
  it("calls t('shop.verified') or t('shop.verified', ...) for the Verified badge", () => {
    expect(homeContent).toMatch(/t\(\s*['"]shop\.verified['"]/);
  });
});
