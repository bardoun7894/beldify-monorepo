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

  it('uses neutral gray-200 hairlines (Atlas card border, amber retired 2026-06-10)', () => {
    expect(pageSrc).toContain('gray-200');
  });

  it('uses the Atlas indigo-950 dark hero strip (indigo-900 is off-scale)', () => {
    expect(pageSrc).toContain('bg-indigo-950');
    expect(pageSrc).not.toContain('bg-indigo-900');
  });
});
