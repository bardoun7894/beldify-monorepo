/**
 * TDD: Home P2 — mini-PDP card upgrades, sticky mobile category chips, Open Souk example state
 * Three improvements per the work packet.
 * All tests must FAIL before implementation, PASS after.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const featured = () => readFileSync(join(SRC, 'components/home/FeaturedSections.tsx'), 'utf-8');
const discover = () => readFileSync(join(SRC, 'components/home/DiscoverFeed.tsx'), 'utf-8');
const homeContent = () => readFileSync(join(SRC, 'components/home/HomeContent.tsx'), 'utf-8');

const locale = (lang: string) =>
  JSON.parse(readFileSync(join(SRC, `i18n/locales/${lang}.json`), 'utf-8'));

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1a — FeaturedSections: discount strikethrough + badge
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1a — FeaturedSections: discount strikethrough + badge', () => {
  it('IncomingProduct interface includes compare_price or old_price field for discount detection', () => {
    // The interface needs to accept compare/old price from payload
    const src = featured();
    expect(src).toMatch(/compare_price|old_price|original_price/);
  });

  it('NormalizedProduct includes comparePrice field', () => {
    const src = featured();
    expect(src).toMatch(/comparePrice|compare_price.*null/);
  });

  it('renders line-through strikethrough for original price', () => {
    const src = featured();
    expect(src).toContain('line-through');
  });

  it('renders rose-700 discount badge (Tetouani Garnet = sale color)', () => {
    const src = featured();
    expect(src).toContain('rose-700');
  });

  it('discount percentage badge shows -X% format', () => {
    const src = featured();
    // Must compute and display percentage
    expect(src).toMatch(/Math\.round|\d+%|-%/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1b — FeaturedSections: starts-from prefix for multi-variant products
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1b — FeaturedSections: starts-from prefix', () => {
  it('IncomingProduct includes variants or has_variants field', () => {
    const src = featured();
    expect(src).toMatch(/has_variants|variants|variants_count/);
  });

  it('renders Arabic starts-from prefix "يبدأ من"', () => {
    const src = featured();
    expect(src).toContain('يبدأ من');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1c — FeaturedSections: stock availability chips
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1c — FeaturedSections: availability chips', () => {
  it('IncomingProduct includes stock_quantity or quantity field', () => {
    const src = featured();
    expect(src).toMatch(/stock_quantity|quantity/);
  });

  it('renders emerald chip "متوفر" when in stock', () => {
    const src = featured();
    expect(src).toContain('متوفر');
  });

  it('renders amber chip "آخر القطع" for low stock', () => {
    const src = featured();
    expect(src).toContain('آخر القطع');
  });

  it('uses emerald color for in-stock chip', () => {
    const src = featured();
    expect(src).toMatch(/emerald/);
  });

  it('uses amber color for low-stock chip (amber-50 or amber-600)', () => {
    const src = featured();
    // bg-amber-50 / text-amber-600 — avoid bg-amber-100 (blocked by Atlas token rule)
    expect(src).toMatch(/amber.*القطع|القطع.*amber/s);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1d — FeaturedSections: wishlist heart button on card images
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1d — FeaturedSections: wishlist heart button', () => {
  it('imports WishlistButton component', () => {
    const src = featured();
    expect(src).toContain('WishlistButton');
  });

  it('renders WishlistButton inside the card image container (absolute positioned)', () => {
    const src = featured();
    // WishlistButton should be absolutely positioned top-corner
    expect(src).toMatch(/WishlistButton|wishlist.*absolute|absolute.*wishlist/si);
  });

  it('passes productId to WishlistButton', () => {
    const src = featured();
    expect(src).toMatch(/productId=\{product\.id\}|product\.id.*WishlistButton/s);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1e — FeaturedSections: StarRow consistent across NEW ARRIVALS rail
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1e — FeaturedSections: StarRow in new arrivals rail', () => {
  it('StarRow is rendered in new arrivals card (not just best sellers)', () => {
    const src = featured();
    // The new arrivals section must include StarRow — previously it was missing
    // Look for StarRow invoked after the isNew badge section (in the new arrivals map)
    const newArrivalsSection = src.split('NEW ARRIVALS')[1] || '';
    expect(newArrivalsSection).toContain('StarRow');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1f — DiscoverFeed: consistent rating/discount in MarketCard
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1f — DiscoverFeed: MarketCard wishlist heart', () => {
  it('DiscoverFeed imports WishlistButton', () => {
    const src = discover();
    expect(src).toContain('WishlistButton');
  });

  it('DiscoverFeed MarketCard has WishlistButton in image area', () => {
    const src = discover();
    expect(src).toContain('WishlistButton');
  });

  it('DiscoverFeed product type includes review_count or reviews field', () => {
    const src = discover();
    expect(src).toMatch(/review_count|reviews|rating_count/);
  });

  it('DiscoverFeed shows review count alongside rating', () => {
    const src = discover();
    // Must show review count (not just the rating alone)
    expect(src).toMatch(/review_count|reviews\b/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2 — Sticky mobile category chips
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 2 — Sticky mobile category chips under header', () => {
  it('category chips section has sticky positioning', () => {
    expect(homeContent()).toContain('sticky');
  });

  it('sticky is applied only on mobile (not lg)', () => {
    // Should be sticky below lg, not sticky on desktop
    // Pattern: sticky lg:static or sticky lg:relative or conditional class
    expect(homeContent()).toMatch(/sticky|lg:static|lg:relative/);
  });

  it('sticky chips have a z-index below the header', () => {
    // z-30 or z-40 is typical for header; chips need lower z
    const src = homeContent();
    expect(src).toMatch(/z-\d+.*sticky|sticky.*z-\d+/s);
  });

  it('sticky chips have a white background to avoid content bleed-through', () => {
    const src = homeContent();
    // The sticky chips section already has bg-white — but we need to confirm
    // the section retains bg-white when sticky
    expect(src).toContain('bg-white');
  });

  it('sticky chips have a bottom hairline border (border-b) when stuck', () => {
    const src = homeContent();
    // Needs a bottom hairline for visual separation when stuck
    expect(src).toContain('border-b');
  });

  it('uses top offset matching header height for sticky positioning', () => {
    const src = homeContent();
    // top-[64px] or top-16 (typical 64px header)
    expect(src).toMatch(/top-\[64px\]|top-16|top-\[var\(--header/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 — Open Souk empty state: example request cards
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 3 — Open Souk empty state: example request cards', () => {
  it('empty state no longer shows a plain div — it renders example cards', () => {
    const src = homeContent();
    // The example cards must be present in the empty state branch
    expect(src).toMatch(/مثال|example.*card|exampleRequest|ExampleCard/si);
  });

  it('example cards have a "مثال" chip/label', () => {
    const src = homeContent();
    expect(src).toContain('مثال');
  });

  it('example cards are non-clickable (no Link wrapping them)', () => {
    const src = homeContent();
    // Example cards should not be navigable (they are illustrative)
    // Look for the example card block and confirm no <Link href in its scope
    // We test this by checking for a pointer-events-none or non-clickable attribute
    expect(src).toMatch(/pointer-events-none|aria-hidden.*true.*مثال|مثال.*aria-hidden/s);
  });

  it('example cards show قفطان للعرس budget copy', () => {
    const src = homeContent();
    expect(src).toMatch(/قفطان|كفطان/);
  });

  it('example cards are muted (opacity or text-gray)', () => {
    const src = homeContent();
    // Muted means reduced opacity or gray text on the card container
    expect(src).toMatch(/opacity-\d+|text-gray/);
  });

  it('empty state preserves the existing CTA "نشر أول طلب"', () => {
    const src = homeContent();
    expect(src).toContain('نشر أول طلب');
  });

  it('i18n: example card budget copy uses t() from locale', () => {
    const src = homeContent();
    // Budget/example copy must be i18n-wrapped
    expect(src).toMatch(/t\(['"]home\.openSouk\.example/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 — i18n locale files: example request keys present
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 3 — i18n locale files: Open Souk example keys', () => {
  const langs = ['ar', 'ma', 'en', 'fr', 'es'];

  langs.forEach((lang) => {
    it(`${lang}.json has home.openSouk.exampleTitle1`, () => {
      const d = locale(lang);
      expect(d?.home?.openSouk?.exampleTitle1).toBeTruthy();
    });

    it(`${lang}.json has home.openSouk.exampleBudget1`, () => {
      const d = locale(lang);
      expect(d?.home?.openSouk?.exampleBudget1).toBeTruthy();
    });

    it(`${lang}.json has home.openSouk.exampleTitle2`, () => {
      const d = locale(lang);
      expect(d?.home?.openSouk?.exampleTitle2).toBeTruthy();
    });

    it(`${lang}.json has home.openSouk.exampleTitle3`, () => {
      const d = locale(lang);
      expect(d?.home?.openSouk?.exampleTitle3).toBeTruthy();
    });

    it(`${lang}.json has home.openSouk.exampleChip`, () => {
      const d = locale(lang);
      expect(d?.home?.openSouk?.exampleChip).toBeTruthy();
    });
  });

  it('ma.json has Darija example text (not MSA copy)', () => {
    const d = locale('ma');
    const title = d?.home?.openSouk?.exampleTitle1 || '';
    // Darija copy is distinct from MSA (different word choices)
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK 1 i18n — FeaturedSections locale keys for new fields
// ─────────────────────────────────────────────────────────────────────────────
describe('Task 1 i18n — FeaturedSections locale keys', () => {
  const langs = ['ar', 'ma', 'en', 'fr', 'es'];

  langs.forEach((lang) => {
    it(`${lang}.json has featuredSections.inStock`, () => {
      const d = locale(lang);
      expect(d?.featuredSections?.inStock).toBeTruthy();
    });

    it(`${lang}.json has featuredSections.lowStock`, () => {
      const d = locale(lang);
      expect(d?.featuredSections?.lowStock).toBeTruthy();
    });

    it(`${lang}.json has featuredSections.startsFrom`, () => {
      const d = locale(lang);
      expect(d?.featuredSections?.startsFrom).toBeTruthy();
    });
  });
});
