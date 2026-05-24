import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('faqs/page.tsx — Atlas compliance', () => {
  // ── Design token drift fixes ───────────────────────────────────────────────
  it('uses indigo-700 for contact CTA (not indigo-600)', () => {
    expect(pageSrc).not.toMatch(/bg-indigo-600[^a-zA-Z0-9]/);
    expect(pageSrc).toContain('bg-indigo-700');
  });

  it('uses indigo-800 for CTA hover (not indigo-700 as hover)', () => {
    expect(pageSrc).toContain('hover:bg-indigo-800');
  });

  // ── i18n completeness ─────────────────────────────────────────────────────
  it('wires FAQ group headings through t()', () => {
    expect(pageSrc).toContain("t(`faqs.groups.");
  });

  it('wires FAQ questions through t()', () => {
    // Should not render raw question strings without t()
    expect(pageSrc).toContain("t(`faqs.items.");
  });

  it('wires "Still have questions" through t()', () => {
    expect(pageSrc).toContain("t('faqs.stillHaveQuestions'");
  });

  it('wires contact link text through t()', () => {
    expect(pageSrc).toContain("t('faqs.contactUs'");
  });

  // ── Atlas visual tokens ────────────────────────────────────────────────────
  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('uses rounded-2xl question cards', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses amber-50 hover surface on FAQ items', () => {
    expect(pageSrc).toContain('amber-50');
  });

  it('uses amber-700 eyebrow for section group labels', () => {
    expect(pageSrc).toContain('text-amber-700');
  });

  it('does not import @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });
});
