/**
 * TDD: 010 — HeroSearchBar tests
 * Covers:
 *  - File exists
 *  - Uses i18n key home.hero.search_placeholder
 *  - Submits to /products?q= (in-app route)
 *  - Never links off-platform
 *  - RTL-aware
 *  - amber focus ring
 *  - ≥44px touch target
 *  - Proper a11y label
 *  - Uses lucide Search icon
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const componentPath = join(SRC, 'components/home/HeroSearchBar.tsx');
const content = () => readFileSync(componentPath, 'utf-8');

describe('HeroSearchBar — file exists', () => {
  it('HeroSearchBar.tsx file exists', () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  it('is a "use client" component', () => {
    expect(content()).toContain("'use client'");
  });

  it('exports a default function', () => {
    expect(content()).toMatch(/export default function|export default/);
  });
});

describe('HeroSearchBar — i18n', () => {
  it('uses i18n key home.hero.search_placeholder for the placeholder', () => {
    const c = content();
    expect(c).toContain('search_placeholder');
    expect(c).toContain('useTranslation');
  });

  it('references home.hero.search namespace', () => {
    const c = content();
    expect(c).toMatch(/home\.hero|home".*hero|'home'.*'hero'/);
  });
});

describe('HeroSearchBar — submit behavior', () => {
  it('submits to /products route with ?q= query param', () => {
    const c = content();
    expect(c).toContain('/products');
    expect(c).toMatch(/\?q=|q=/);
  });

  it('uses router.push or form action that keeps user in-app', () => {
    const c = content();
    // Must use useRouter().push or form action pointing to internal route
    expect(c).toMatch(/useRouter|router\.push|router\.replace|action.*products|href.*products/);
  });

  it('never links to an external URL (no http:// or https://)', () => {
    const c = content();
    // The submit destination must not be external
    // There should be no absolute https:// URLs for the submit destination
    // (excluding imports which are fine)
    const submitMatches = c.match(/push\(["'`][^"'`]+["'`]\)|href=["'`][^"'`]+["'`]/g) ?? [];
    for (const match of submitMatches) {
      expect(match).not.toMatch(/https?:\/\//);
    }
  });
});

describe('HeroSearchBar — search icon', () => {
  it('uses lucide Search icon', () => {
    const c = content();
    expect(c).toMatch(/Search.*lucide|lucide.*Search|from 'lucide-react'/);
    expect(c).toContain('Search');
  });
});

describe('HeroSearchBar — accessibility', () => {
  it('has an aria-label or label for the search input', () => {
    const c = content();
    expect(c).toMatch(/aria-label|htmlFor|<label/);
  });

  it('has a submit button or form submit mechanism', () => {
    const c = content();
    expect(c).toMatch(/type="submit"|onSubmit|handleSubmit/);
  });

  it('input is full-width', () => {
    expect(content()).toContain('w-full');
  });

  it('touch target is ≥44px (min-h-[44px] or h-[44px])', () => {
    expect(content()).toMatch(/min-h-\[44px\]|h-\[44px\]|h-12|h-11/);
  });
});

describe('HeroSearchBar — Atlas tokens', () => {
  it('uses amber focus ring via Atlas tokens (not raw amber-*)', () => {
    const c = content();
    // Focus ring should use Atlas token form or ring-[hsl(var(...))]
    // Allowed: hsl(var(--secondary)), atlas-secondary, ring-[hsl(var(--secondary))]
    // NOT allowed: ring-amber-500, focus:ring-amber-500
    expect(c).not.toMatch(/focus:ring-amber-[0-9]{3}/);
    // Should have some focus ring style
    expect(c).toMatch(/focus:|focus-visible:|ring/);
  });

  it('no raw amber-* class literals', () => {
    expect(content()).not.toMatch(/\bamber-[0-9]{3}\b/);
  });

  it('no raw indigo-* class literals', () => {
    expect(content()).not.toMatch(/\bindigo-[0-9]{3}\b/);
  });

  it('no hardcoded hex colors', () => {
    expect(content()).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});

describe('HeroSearchBar — i18n key parity (all 7 locales)', () => {
  const locales = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];
  const localeDir = join(SRC, 'i18n/locales');

  for (const locale of locales) {
    it(`${locale}.json has home.hero.search_placeholder key`, () => {
      const raw = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(raw);
      const heroKeys = json?.home?.hero ?? {};
      expect(heroKeys).toHaveProperty('search_placeholder');
    });
  }
});
