import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('size-guide/page.tsx — Atlas compliance', () => {
  it('does not import from @heroicons', () => {
    expect(pageSrc).not.toContain('@heroicons');
  });

  it('imports icons from lucide-react', () => {
    expect(pageSrc).toContain('lucide-react');
  });

  it('uses Atlas indigo-900 hero strip', () => {
    expect(pageSrc).toContain('bg-indigo-900');
  });

  it('uses rounded-2xl for cards (Atlas card radius)', () => {
    expect(pageSrc).toContain('rounded-2xl');
  });

  it('uses rounded-full for tab pills (Atlas pill pattern)', () => {
    expect(pageSrc).toContain('rounded-full');
  });

  it('does not use dark: class variants', () => {
    expect(pageSrc).not.toContain('dark:');
  });

  it('wires the measurement guide alt text to i18n key', () => {
    expect(pageSrc).not.toContain('alt="Measurement Guide"');
    expect(pageSrc).toContain('content.sizeGuide.measurementGuideAlt');
  });

  it('wires length range text to i18n key (not hardcoded)', () => {
    expect(pageSrc).not.toContain("lengths range from 150cm");
    expect(pageSrc).toContain('content.sizeGuide.lengthRange');
  });
});
