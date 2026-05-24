import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('services/tailoring/tailors/[id]/page.tsx — Atlas compliance', () => {
  it('does not import from @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });

  it('imports icons from lucide-react', () => {
    expect(pageSrc).toContain('lucide-react');
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

  it('does not use raw <img> tags (must use next/image or background)', () => {
    expect(pageSrc).not.toMatch(/<img\s/);
  });

  it('uses rounded-2xl for cards', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses amber-200 for borders/rings (Atlas hairlines)', () => {
    expect(pageSrc).toContain('amber-200');
  });

  it('uses indigo-700 for primary CTA buttons (not green for WhatsApp)', () => {
    // Green should only appear for WhatsApp branding color (that is OK per DESIGN.md)
    // But the primary CTA "Book Appointment" must be indigo
    expect(pageSrc).toContain('indigo-700');
  });
});
