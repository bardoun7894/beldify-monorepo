/**
 * home-merchandising-layer TDD gate
 *
 * Covers:
 *   1. Promo marquee — Navbar.tsx cycles 4 value props via CSS crossfade
 *   2. Shop-by-occasion grid — HomeContent.tsx, placed after trust strip
 *   3. Department zones — 2 editorial feature banners in HomeContent.tsx
 *   4. i18n parity — all 13 new keys present in all 7 locales
 *   5. RTL correctness — no physical ml-/mr- in touched components
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const LOCALE_DIR = join(ROOT, 'src/i18n/locales');
const SRC = join(ROOT, 'src');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

function readLocale(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(LOCALE_DIR, `${locale}.json`), 'utf-8'));
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

const ALL_LOCALES = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];

// ─── D1: Promo marquee in Navbar.tsx ──────────────────────────────────────────

describe('Deliverable 1 — Promo marquee in Navbar.tsx', () => {
  const navbar = read('src/components/layout/Navbar.tsx');

  it('uses marquee i18n key home.marquee.free_delivery', () => {
    expect(navbar).toContain('home.marquee.free_delivery');
  });

  it('uses marquee i18n key home.marquee.returns', () => {
    expect(navbar).toContain('home.marquee.returns');
  });

  it('uses marquee i18n key home.marquee.cod', () => {
    expect(navbar).toContain('home.marquee.cod');
  });

  it('uses marquee i18n key home.marquee.support', () => {
    expect(navbar).toContain('home.marquee.support');
  });

  it('retains bg-indigo-950 background on the announcement strip', () => {
    expect(navbar).toContain('bg-indigo-950');
  });

  it('retains amber text styling on the announcement strip', () => {
    expect(navbar).toMatch(/text-amber/);
  });

  it('includes reduced-motion guard (shows static message when motion disabled)', () => {
    // Either a CSS class name with reduced-motion or a data attribute / aria approach
    expect(navbar).toMatch(/motion-reduce|prefers-reduced-motion|marquee-static/);
  });

  it('does not import a new third-party animation library', () => {
    // Must NOT import framer-motion, react-spring, or any new dep for the marquee
    expect(navbar).not.toMatch(/from\s+['"]framer-motion['"]/);
    expect(navbar).not.toMatch(/from\s+['"]@react-spring/);
  });
});

// ─── D2: Shop-by-occasion grid in HomeContent.tsx ─────────────────────────────

describe('Deliverable 2 — Shop-by-occasion grid in HomeContent.tsx', () => {
  const home = read('src/components/home/HomeContent.tsx');

  it('uses section heading key home.occasion.title', () => {
    expect(home).toContain('home.occasion.title');
  });

  it('uses subtitle key home.occasion.subtitle', () => {
    expect(home).toContain('home.occasion.subtitle');
  });

  it('uses tile key home.occasion.wedding', () => {
    expect(home).toContain('home.occasion.wedding');
  });

  it('uses tile key home.occasion.eid', () => {
    expect(home).toContain('home.occasion.eid');
  });

  it('uses tile key home.occasion.summer', () => {
    expect(home).toContain('home.occasion.summer');
  });

  it('uses tile key home.occasion.gifts', () => {
    expect(home).toContain('home.occasion.gifts');
  });

  it('renders a 4-tile occasion grid with 2-col mobile / 4-col desktop', () => {
    expect(home).toMatch(/grid-cols-2.*lg:grid-cols-4|lg:grid-cols-4.*grid-cols-2/);
  });

  it('links wedding tile to /products?category=festive', () => {
    expect(home).toContain('/products?category=festive');
  });

  it('links eid tile to /categories/caftan', () => {
    expect(home).toContain('/categories/caftan');
  });

  it('links summer tile to /categories/womens-djellaba', () => {
    expect(home).toContain('/categories/womens-djellaba');
  });

  it('links gifts tile to /categories/jewelry', () => {
    expect(home).toContain('/categories/jewelry');
  });

  it('occasion tiles include gradient scrim (same treatment as cat grid)', () => {
    expect(home).toMatch(/bg-gradient-to-t.*from-black/);
  });

  it('occasion tiles include hover lift (hover:-translate-y-1)', () => {
    expect(home).toContain('hover:-translate-y-1');
  });

  it('occasion tiles include image zoom on hover (group-hover:scale-110)', () => {
    expect(home).toContain('group-hover:scale-110');
  });

  it('ArrowRight icon has rtl:rotate-180 for RTL direction', () => {
    expect(home).toContain('rtl:rotate-180');
  });

  it('OccasionGrid component is called BEFORE the category grid section comment', () => {
    // The <OccasionGrid> call in the JSX should appear before the CATEGORY GRID comment
    const occasionCallIdx = home.indexOf('<OccasionGrid');
    const catGridIdx = home.indexOf('CATEGORY GRID');
    expect(occasionCallIdx).toBeGreaterThan(-1);
    expect(catGridIdx).toBeGreaterThan(-1);
    expect(occasionCallIdx).toBeLessThan(catGridIdx);
  });

  it('has onError image fallback handler on occasion tiles (in OccasionTile component)', () => {
    // OccasionTile renders <Image onError=… /> for graceful fallback
    const tileIdx = home.indexOf('OccasionTile');
    expect(tileIdx).toBeGreaterThan(-1);
    // The OccasionTile definition follows, and should contain onError
    const tileSection = home.slice(tileIdx);
    expect(tileSection).toContain('onError');
  });
});

// ─── D3: Department zones REMOVED — design decision ──────────────────────────
// DepartmentZones and DepartmentZoneCard components are removed; zone keys in
// locale JSONs remain for i18n parity but the render call and sub-components
// are gone. These tests verify the removal is clean.

describe('Deliverable 3 — Department zones removed from HomeContent.tsx', () => {
  const home = read('src/components/home/HomeContent.tsx');

  it('does NOT render <DepartmentZones', () => {
    expect(home).not.toContain('<DepartmentZones');
  });

  it('does NOT define DepartmentZones function', () => {
    expect(home).not.toContain('function DepartmentZones(');
  });

  it('does NOT define DepartmentZoneCard function', () => {
    expect(home).not.toContain('function DepartmentZoneCard(');
  });
});

// ─── D1-ext: Marquee accessibility and Arabic font ────────────────────────────

describe('Deliverable 1-ext — Marquee a11y restructure in Navbar.tsx', () => {
  const navbar = read('src/components/layout/Navbar.tsx');

  it('has a sr-only list (ul) that exposes all marquee messages to AT', () => {
    // The AT surface is a visually-hidden <ul className="sr-only">
    expect(navbar).toMatch(/sr-only/);
    expect(navbar).toMatch(/<ul/);
  });

  it('the animated container is aria-hidden="true" as a whole', () => {
    // The animated div/container should be aria-hidden="true"
    expect(navbar).toMatch(/aria-hidden[={"]+true/);
  });

  it('does NOT use role="marquee" on the promo strip outer element', () => {
    // role="marquee" implies aria-live=off and non-essential — wrong for policy info
    expect(navbar).not.toMatch(/role=["']marquee["']/);
  });

  it('animated message spans do NOT have individual per-item aria-hidden', () => {
    // After restructure, individual <span aria-hidden={idx !== 0}> must be gone
    // Check: no aria-hidden tied to idx (the pattern was aria-hidden={idx !== 0})
    expect(navbar).not.toMatch(/aria-hidden=\{idx !== 0\}/);
  });

  it('applies font-arabic class to message spans on Arabic locales', () => {
    // isArabicLocale ? 'font-arabic' : '' pattern
    expect(navbar).toMatch(/isArabicLocale.*font-arabic|font-arabic.*isArabicLocale/s);
  });

  it('derives isArabicLocale from i18n.language', () => {
    expect(navbar).toMatch(/isArabicLocale/);
    // Must reference i18n.language to derive it
    expect(navbar).toMatch(/i18n\.language/);
  });
});

// ─── D2-ext: Occasion grid RTL and Arabic typography fixes ────────────────────

describe('Deliverable 2-ext — OccasionTile RTL + Arabic typography in HomeContent.tsx', () => {
  const home = read('src/components/home/HomeContent.tsx');

  it('CTA pill entrance uses rtl:translate-x-1 for correct RTL direction', () => {
    // The pill: -translate-x-1 rtl:translate-x-1 group-hover:translate-x-0
    expect(home).toContain('rtl:translate-x-1');
  });

  it('OccasionGrid eyebrow span does NOT apply uppercase+tracking unconditionally on Arabic', () => {
    // Must be gated: isArabicScript ? 'font-arabic' : 'uppercase tracking-[0.18em]'
    // The eyebrow span must NOT have both isArabicScript font-arabic AND uppercase together unconditionally
    // Simplest check: the span uses a conditional (ternary) for the classes
    // Pattern: isArabicScript ? 'font-arabic' : ... uppercase ...
    expect(home).toMatch(/isArabicScript.*font-arabic.*uppercase|font-arabic.*isArabicScript.*uppercase/s);
  });
});

// ─── D4: i18n — all 13 keys in all 7 locales ──────────────────────────────────

const MARQUEE_KEYS = [
  'home.marquee.free_delivery',
  'home.marquee.returns',
  'home.marquee.cod',
  'home.marquee.support',
];

const OCCASION_KEYS = [
  'home.occasion.title',
  'home.occasion.subtitle',
  'home.occasion.wedding',
  'home.occasion.eid',
  'home.occasion.summer',
  'home.occasion.gifts',
];

const ZONE_KEYS = [
  'home.zones.wedding',
  'home.zones.jewelry',
  'home.zones.cta',
];

const ALL_NEW_KEYS = [...MARQUEE_KEYS, ...OCCASION_KEYS, ...ZONE_KEYS];

describe('Deliverable 4 — i18n key parity across 7 locales', () => {
  for (const locale of ALL_LOCALES) {
    describe(`Locale: ${locale}`, () => {
      for (const key of ALL_NEW_KEYS) {
        it(`has key ${key}`, () => {
          const data = readLocale(locale);
          const value = getNestedValue(data, key);
          expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
          expect(typeof value, `${locale}.${key} must be a string`).toBe('string');
        });
      }
    });
  }
});

// ─── D5: RTL — no physical ml-/mr- introduced in touched files ────────────────

describe('RTL correctness — no bare ml-/mr- in Navbar or HomeContent', () => {
  const FILES = [
    'src/components/layout/Navbar.tsx',
    'src/components/home/HomeContent.tsx',
  ];

  for (const filePath of FILES) {
    it(`${filePath} uses logical spacing (no ml-N or mr-N classes)`, () => {
      const source = read(filePath);
      // Filter out comment lines
      const codeLines = source
        .split('\n')
        .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'));
      const codeBody = codeLines.join('\n');
      const physicalSpacing = /\b(ml|mr)-\d/.test(codeBody);
      expect(physicalSpacing, `Found physical ml-/mr- in ${filePath}; use ms-/me- instead`).toBe(false);
    });
  }
});
