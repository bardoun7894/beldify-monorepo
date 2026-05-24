import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(
  join(__dirname, '../page.tsx'),
  'utf-8'
);

describe('terms-of-service/page.tsx — Atlas compliance', () => {
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

  it('fixes namespace bug: no wrong privacyPolicy.contactUs key', () => {
    // Line 214 in old code used wrong namespace
    expect(pageSrc).not.toContain("pages.privacyPolicy.contactUs");
  });

  it('uses correct termsOfService.contactUs key', () => {
    expect(pageSrc).toContain("pages.termsOfService.contactUs");
  });

  it('wires prose body text to i18n keys under content.termsOfService.*', () => {
    // The old file had hardcoded "Welcome to Beldify" prose
    expect(pageSrc).not.toContain('"Welcome to Beldify. These Terms');
    expect(pageSrc).toContain('content.termsOfService.');
  });
});
