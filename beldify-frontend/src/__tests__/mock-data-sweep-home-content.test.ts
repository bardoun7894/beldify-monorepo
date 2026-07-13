/**
 * TDD — mock-data-sweep: HomeContent must never fabricate named businesses,
 * ratings, or human authors as a fallback / placeholder.
 *
 * Prior fabrication (already fixed elsewhere): shops/[name]/page.tsx rendered
 * generic category art as "Atelier interior" photos, and a stock hero image
 * as a seller's own storefront cover. This test locks down the equivalent
 * class of leak inside the homepage ateliers rail + journal section:
 * fake business names ("Maison Tetouan", ...) with fake star ratings shown
 * as if they were real, verifiable ateliers, and fake human bylines
 * ("Imane Bennani", ...) attributed to editorial content that doesn't exist.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const FILE = 'src/components/home/HomeContent.tsx';

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

describe('HomeContent — no fabricated ateliers or bylines', () => {
  let source: string;

  beforeAll(() => {
    source = read(FILE);
  });

  it('does not hardcode fake atelier business names', () => {
    const fakeNames = [
      'Maison Tetouan',
      'Dar Fes Atelier',
      'Casablanca Couture',
      'Dar Marrakech',
    ];
    for (const name of fakeNames) {
      expect(source).not.toContain(name);
    }
  });

  it('does not hardcode fake journal author bylines', () => {
    const fakeAuthors = ['Imane Bennani', 'Salma El Aoud', 'Karim Lahlou'];
    for (const author of fakeAuthors) {
      expect(source).not.toContain(author);
    }
  });

  it('ateliers rail shows an honest empty state when there is no live data', () => {
    // When both recommendedTailors and recommendedSellers are empty, the rail
    // must not synthesize fake business cards — it should render a genuine
    // "coming soon" empty state instead.
    expect(source).toContain('home.ateliers.empty');
  });
});
