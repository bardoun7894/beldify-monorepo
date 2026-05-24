import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('services/tailoring/tailors/page.tsx — Atlas compliance', () => {
  it('has "use client" directive', () => {
    expect(pageSrc).toContain("'use client'");
  });

  it('imports useTranslation for i18n', () => {
    expect(pageSrc).toContain('useTranslation');
  });

  it('does not import from @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });

  it('does not use primary-* tokens (non-Atlas)', () => {
    expect(pageSrc).not.toMatch(/\bprimary-\d+\b/);
  });

  it('does not use neutral-* tokens (non-Atlas)', () => {
    expect(pageSrc).not.toMatch(/\bneutral-\d+\b/);
  });

  it('does not use dark: class variants', () => {
    expect(pageSrc).not.toContain('dark:');
  });

  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('uses next/image instead of <img>', () => {
    expect(pageSrc).toContain("from 'next/image'");
    // No raw <img> tags
    expect(pageSrc).not.toMatch(/<img\s/);
  });

  it('uses lucide-react for icons (not inline SVG for data icons)', () => {
    expect(pageSrc).toContain('lucide-react');
  });

  it('uses rounded-2xl for cards', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('wires UI copy to i18n keys', () => {
    // "Expert Tailors" or "Featured Tailors" should NOT be raw strings
    expect(pageSrc).not.toContain('"Expert Tailors"');
    expect(pageSrc).not.toContain('"Featured Tailors"');
  });
});
