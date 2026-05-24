import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('privacy-policy/page.tsx — Atlas compliance', () => {
  it('does not import from @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });

  it('imports icons from lucide-react', () => {
    expect(pageSrc).toContain('lucide-react');
  });

  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('uses rounded-2xl (not rounded-md) for callout panel', () => {
    expect(pageSrc).toContain('rounded-2xl');
    expect(pageSrc).not.toContain('rounded-md bg-indigo-50');
  });

  it('declares TranslationArray type locally (not missing)', () => {
    expect(pageSrc).toContain('TranslationArray');
    // Must be declared — not just referenced as unknown type
    expect(pageSrc).toMatch(/type TranslationArray|TranslationArray = /);
  });
});
