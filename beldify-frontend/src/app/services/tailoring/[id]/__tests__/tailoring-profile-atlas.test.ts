import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('services/tailoring/[id]/page.tsx — Atlas compliance', () => {
  it('does not import from @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });

  it('imports icons from lucide-react', () => {
    expect(pageSrc).toContain('lucide-react');
  });

  it('uses rounded-2xl for cards (Atlas card radius)', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses amber-200 ring hairlines (Atlas card border)', () => {
    expect(pageSrc).toContain('amber-200');
  });

  it('preserves bg-indigo-900 hero strip (already present)', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });
});
