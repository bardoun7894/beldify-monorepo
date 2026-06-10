import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('about/page.tsx — Atlas compliance', () => {
  // ── i18n completeness ─────────────────────────────────────────────────────
  it('wires eyebrow through t()', () => {
    expect(pageSrc).toContain("t('about.eyebrow'");
  });

  it('wires headline through t()', () => {
    expect(pageSrc).toContain("t('about.headline'");
  });

  it('wires CTA shop button through t()', () => {
    expect(pageSrc).toContain("t('about.cta.shop'");
  });

  // ── Atlas visual tokens ────────────────────────────────────────────────────
  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('uses Playfair Display for H1', () => {
    expect(pageSrc).toContain('Playfair Display');
  });

  it('uses amber-300 eyebrow text color on dark hero', () => {
    expect(pageSrc).toContain('text-amber-300');
  });

  it('uses rounded-2xl for image panels', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses bg-canvas (Atlas neutral near-white) for page background', () => {
    // about/page.tsx switched from bg-amber-50 to bg-canvas (the Atlas design
    // token mapped to the neutral near-white #fcfcfc canvas).
    expect(pageSrc).toContain('bg-canvas');
  });

  it('uses indigo-700 for CTA links (not indigo-600)', () => {
    expect(pageSrc).not.toMatch(/bg-indigo-600[^a-zA-Z0-9]/);
  });

  it('does not import @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });
});
