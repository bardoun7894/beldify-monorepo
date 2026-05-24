import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('contact/page.tsx — Atlas compliance', () => {
  // ── Design token drift fixes ───────────────────────────────────────────────
  it('uses rounded-2xl for inputs (not rounded-lg)', () => {
    // Must not have any rounded-lg on input/textarea
    expect(pageSrc).not.toMatch(/rounded-lg.*border.*amber/);
    // Must have rounded-2xl
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses indigo-700 for submit button (not indigo-600)', () => {
    expect(pageSrc).toContain('bg-indigo-700');
    expect(pageSrc).not.toMatch(/bg-indigo-600[^a-zA-Z0-9]/);
  });

  it('uses rose-700 for validation errors (not red-600)', () => {
    expect(pageSrc).not.toContain('text-red-600');
    expect(pageSrc).toContain('text-rose-700');
  });

  it('uses amber-500 focus ring color', () => {
    expect(pageSrc).toContain('focus:ring-amber-500');
  });

  // ── i18n completeness ─────────────────────────────────────────────────────
  it('wires eyebrow through t()', () => {
    expect(pageSrc).toContain("t('contact.eyebrow'");
  });

  it('wires form heading through t()', () => {
    expect(pageSrc).toContain("t('contact.form.heading'");
  });

  it('wires submit button through t()', () => {
    expect(pageSrc).toContain("t('contact.form.send'");
  });

  // ── Atlas visual tokens ────────────────────────────────────────────────────
  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('uses amber-50 contact info panels', () => {
    expect(pageSrc).toContain('amber-50');
  });

  it('does not import @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });
});
