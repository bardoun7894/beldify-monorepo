/**
 * TDD gate — RTL binary string anti-pattern elimination
 *
 * Proves that `isRTL ? 'Arabic' : 'English'` occurrences (visible to grep
 * as isRTL followed by a quote containing an Arabic character) have been
 * replaced with t() calls across the 9 in-scope files.
 *
 * Exclusions per task spec:
 *   - Arabic-content INPUT placeholders in seller/products new+edit pages
 *     ("قفطان مغربي ملكي", "وصف المنتج بالعربية…") — those are left alone.
 *   - The locale JSON files themselves (read-only, managed by orchestrator).
 *
 * Test also validates that the key manifest file exists and has entries.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

/** Returns lines that match the isRTL binary anti-pattern (Arabic char in the string branch) */
function findRtlBinaryOccurrences(filePath: string): string[] {
  if (!existsSync(filePath)) return [];
  const source = readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');
  // Pattern: isRTL ? 'something-with-arabic' or isRTL ? `something-with-arabic`
  const arabicRange = /[؀-ۿ]/;
  return lines.filter(line => {
    // skip pure comment lines
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
    // Look for: isRTL ? ['"`]...arabic
    return /isRTL\s*\?\s*['"`]/.test(line) && arabicRange.test(line);
  });
}

const IN_SCOPE_FILES = [
  'src/app/seller/custom-orders/page.tsx',
  'src/app/custom-orders/new/page.tsx',
  'src/app/custom-orders/[id]/page.tsx',
  'src/components/seller/VerticalProductForm.tsx',
  'src/components/seller/QuoteForm.tsx',
  'src/components/seller/CustomOrderTimeline.tsx',
  'src/components/products/JewelryFields.tsx',
  'src/components/checkout/MadeToOrderTimeline.tsx',
  'src/components/checkout/CustomOrderForm.tsx',
  'src/app/seller/store-settings/page.tsx',
];

describe('RTL binary anti-pattern — all occurrences replaced with t()', () => {
  for (const relPath of IN_SCOPE_FILES) {
    it(`${relPath} has no isRTL ? 'Arabic' string picks`, () => {
      const filePath = join(ROOT, relPath);
      const violations = findRtlBinaryOccurrences(filePath);
      expect(
        violations,
        `Found ${violations.length} RTL binary anti-pattern(s) in ${relPath}:\n${violations.map(l => '  ' + l.trim()).join('\n')}`
      ).toHaveLength(0);
    });
  }
});

describe('RTL binary — labelAr/descriptionAr data-map variants removed', () => {
  it('seller/store-settings/page.tsx has no labelAr or descriptionAr properties in VERTICAL_OPTIONS', () => {
    const filePath = join(ROOT, 'src/app/seller/store-settings/page.tsx');
    const source = readFileSync(filePath, 'utf-8');
    // labelAr and descriptionAr were data-map fields that held Arabic strings
    expect(source).not.toMatch(/labelAr\s*:/);
    expect(source).not.toMatch(/descriptionAr\s*:/);
  });

  it('seller/store-settings/page.tsx badge property contains no hardcoded Arabic text', () => {
    const filePath = join(ROOT, 'src/app/seller/store-settings/page.tsx');
    const source = readFileSync(filePath, 'utf-8');
    // badge: 'جديد' should be replaced with t()
    const arabicRange = /[؀-ۿ]/;
    // Only flag badge: '...arabic...' patterns
    const badgeLine = source.split('\n').find(
      l => /badge\s*:/.test(l) && arabicRange.test(l) && !l.trim().startsWith('//')
    );
    expect(badgeLine).toBeUndefined();
  });

  it('seller/custom-orders/page.tsx STATUS_META access uses t() not labelAr', () => {
    const filePath = join(ROOT, 'src/app/seller/custom-orders/page.tsx');
    const source = readFileSync(filePath, 'utf-8');
    expect(source).not.toContain('meta.labelAr');
  });

  it('CustomOrderTimeline.tsx STATUS_META access uses t() not labelAr', () => {
    const filePath = join(ROOT, 'src/components/seller/CustomOrderTimeline.tsx');
    const source = readFileSync(filePath, 'utf-8');
    expect(source).not.toContain('meta.labelAr');
  });

  it('MadeToOrderTimeline.tsx STATUS_META access uses t() not labelAr', () => {
    const filePath = join(ROOT, 'src/components/checkout/MadeToOrderTimeline.tsx');
    const source = readFileSync(filePath, 'utf-8');
    expect(source).not.toContain('meta.labelAr');
  });
});

describe('RTL binary — JewelryFields FIELD_LABELS uses t() not hardcoded ar property', () => {
  it('JewelryFields.tsx does not use isRTL ? FIELD_LABELS[key].ar : FIELD_LABELS[key].en pattern', () => {
    const filePath = join(ROOT, 'src/components/products/JewelryFields.tsx');
    const source = readFileSync(filePath, 'utf-8');
    // The FIELD_LABELS map with .ar props should be gone; label resolution should use t()
    expect(source).not.toMatch(/FIELD_LABELS\[.*\]\.ar/);
    expect(source).not.toMatch(/isRTL\s*\?\s*FIELD_LABELS/);
  });
});

describe('RTL binary — key manifest completeness', () => {
  const MANIFEST_PATH = join(ROOT, '.cache/i18n-work/extra/rtl-binary-keys.json');

  it('rtl-binary-keys.json exists', () => {
    expect(existsSync(MANIFEST_PATH)).toBe(true);
  });

  it('rtl-binary-keys.json is valid JSON with at least 30 entries', () => {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    const data = JSON.parse(raw) as Record<string, { en: string; ar: string }>;
    const keys = Object.keys(data);
    expect(keys.length).toBeGreaterThanOrEqual(30);
  });

  it('every entry in rtl-binary-keys.json has both en and ar fields', () => {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    const data = JSON.parse(raw) as Record<string, { en: string; ar: string }>;
    for (const [key, val] of Object.entries(data)) {
      expect(val.en, `${key}.en must be a non-empty string`).toBeTruthy();
      expect(val.ar, `${key}.ar must be a non-empty string`).toBeTruthy();
    }
  });
});
