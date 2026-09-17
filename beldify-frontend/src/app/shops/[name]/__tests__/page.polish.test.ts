/**
 * TDD — Shop storefront page polish/adapt/harden static-analysis tests.
 *
 * Verifies: localized hero name (i18n), touch-target-safe filter pills,
 * overflow-safe long shop names, and a guarded avatar-initial fallback.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOURCE = readFileSync(
  join(__dirname, '..', 'page.tsx'),
  'utf-8'
);

describe('shop storefront page — polish/adapt/harden', () => {
  it('localizes the hero shop name instead of always rendering the English name', () => {
    // The hero <h1> must render a name resolved via isRTL, not hardcode shop.name.
    const h1Block = SOURCE.slice(
      SOURCE.indexOf('text-white text-4xl'),
      SOURCE.indexOf('</h1>')
    );
    expect(h1Block).toMatch(/\{displayName\}/);

    const displayNameDecl = SOURCE.slice(
      SOURCE.indexOf('const displayName'),
      SOURCE.indexOf('const displayName') + 200
    );
    expect(displayNameDecl).toMatch(/isRTL\s*\?/);
  });

  it('guards the "discover more ateliers" avatar initial against an empty name', () => {
    expect(SOURCE).not.toMatch(/atelier\.name\.charAt\(0\)/);
  });

  it('keeps long shop names from breaking layout with a wrap/break class', () => {
    const h1Block = SOURCE.slice(
      SOURCE.indexOf('text-white text-4xl'),
      SOURCE.indexOf('text-white text-4xl') + 300
    );
    expect(h1Block).toMatch(/break-words/);
  });

  it('gives filter pills a touch-safe minimum height (>=44px)', () => {
    const pillsBlock = SOURCE.slice(
      SOURCE.indexOf('FILTER_PILLS.map'),
      SOURCE.indexOf('FILTER_PILLS.map') + 500
    );
    expect(pillsBlock).toMatch(/min-h-\[44px\]/);
  });
});
