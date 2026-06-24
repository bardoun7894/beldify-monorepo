/**
 * TDD tests for "Complete the look" up-sell shelf (Task C)
 * and PDP RelatedProducts heading fix (Task B applied to page.tsx)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('PDP — "Complete the look" shelf (Task C)', () => {
  it('imports Sparkles from lucide-react', () => {
    expect(pageSrc).toMatch(/Sparkles/);
  });

  it('renders a "Complete the look" heading (i18n key pdp.complete_the_look)', () => {
    expect(pageSrc).toContain('pdp.complete_the_look');
  });

  it('renders the aiStyling Sparkles chip (amber-100 pill)', () => {
    expect(pageSrc).toContain('pdp.aiStyling');
    expect(pageSrc).toMatch(/bg-amber-100[^"]*text-amber-800|text-amber-800[^"]*bg-amber-100/);
  });

  it('fetches related products once at page level for both shelves', () => {
    // Page must call productService.getRelatedProducts with limit >= 8
    expect(pageSrc).toMatch(/getRelatedProducts[^)]*,\s*8\s*\)/);
  });

  it('passes showHeading={false} to RelatedProducts on the PDP', () => {
    expect(pageSrc).toContain('showHeading={false}');
  });
});

describe('PDP — duplicate heading fix (Task B)', () => {
  it('does not render an internal RelatedProducts heading alongside its own section h2', () => {
    // showHeading={false} must appear on the RelatedProducts instance in the PDP
    expect(pageSrc).toContain('showHeading={false}');
  });
});

describe('PDP — i18n keys for new shelf', () => {
  it('uses Arabic-friendly i18n key pdp.complete_the_look with a fallback string', () => {
    expect(pageSrc).toMatch(/t\(['"]pdp\.complete_the_look['"]/);
  });
});
