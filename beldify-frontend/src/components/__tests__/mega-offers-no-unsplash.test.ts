/**
 * TDD RED→GREEN — MegaOffers must not contain any unsplash.com URLs.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const src = readFileSync(join(__dirname, '../MegaOffers.tsx'), 'utf-8');

describe('MegaOffers.tsx — real data only', () => {
  it('contains zero unsplash.com URLs', () => {
    expect(src).not.toContain('unsplash.com');
  });

  it('imports from megaOfferService (real service, not mock)', () => {
    expect(src).toContain('megaOfferService');
  });

  it('does not define TEST_MEGA_OFFERS mock constant', () => {
    expect(src).not.toContain('TEST_MEGA_OFFERS');
  });

  it('returns null when offers array is empty', () => {
    // The component returns null when offers.length === 0
    expect(src).toMatch(/offers\.length\s*===\s*0/);
    expect(src).toContain('return null');
  });
});
