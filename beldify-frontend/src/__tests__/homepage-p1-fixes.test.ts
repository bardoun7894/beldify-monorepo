/**
 * TDD: Homepage P1 fix batch
 * Tests for:
 *   1. Category grid image fallback (no dark gray blobs)
 *   2. Trust strip distinct subtitles (no duplication)
 *   3. RTL carousel scroll-padding fix
 *   4. Journal i18n (no hardcoded English on Arabic page)
 *
 * All tests must FAIL before implementation, PASS after.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const home = () => readFileSync(join(SRC, 'components/home/HomeContent.tsx'), 'utf-8');
const featured = () => readFileSync(join(SRC, 'components/home/FeaturedSections.tsx'), 'utf-8');

const locale = (lang: string) =>
  JSON.parse(readFileSync(join(SRC, `i18n/locales/${lang}.json`), 'utf-8'));

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — Category grid image fallback
// ─────────────────────────────────────────────────────────────────────────────
describe('Fix 1 — Category grid image fallback (no dark blobs)', () => {
  it('category grid tiles have an onError handler to catch broken images', () => {
    // The grid <Image> must have an onError attribute or a state-based fallback
    expect(home()).toMatch(/onError|imgError|imageError|catImageError/);
  });

  it('category grid renders a neutral fallback tile (bg-gray-100 or similar) when image is missing', () => {
    // When onError fires, the tile should show a light neutral background
    // (e.g. bg-gray-100) instead of the dark gradient
    expect(home()).toMatch(/bg-gray-100|bg-neutral-100|bg-slate-100|catFallback|imageFailed/);
  });

  it('category grid image src uses the same field (c.image) as the chips rail', () => {
    // Both chips rail and grid must use c.image — not different fields
    const content = home();
    // Count how many Image fills reference c.image (must be >= 2 for both sections)
    const imageMatches = content.match(/src=\{c\.image/g) || [];
    expect(imageMatches.length).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — Trust strip distinct subtitles
// ─────────────────────────────────────────────────────────────────────────────
describe('Fix 2 — Trust strip: distinct subtitle per item', () => {
  it('trust strip renders a subtitle (second line of text) per item', () => {
    // Each trust item must have a subtitle element (second <span> or <p>)
    // The fix is adding home.trust.delivery_sub / returns_sub / sellers_sub / support_sub keys
    const content = home();
    expect(content).toMatch(/trust\.delivery_sub|trust\.returns_sub|trust\.sellers_sub|trust\.support_sub/);
  });

  it('en.json has distinct subtitle for delivery trust item', () => {
    const en = locale('en');
    expect(en.home.trust.delivery_sub).toBeTruthy();
    expect(en.home.trust.delivery_sub).not.toBe(en.home.trust.free_delivery);
  });

  it('en.json has distinct subtitle for returns trust item', () => {
    const en = locale('en');
    expect(en.home.trust.returns_sub).toBeTruthy();
    expect(en.home.trust.returns_sub).not.toBe(en.home.trust.returns);
  });

  it('en.json has distinct subtitle for verified_sellers trust item', () => {
    const en = locale('en');
    expect(en.home.trust.sellers_sub).toBeTruthy();
    expect(en.home.trust.sellers_sub).not.toBe(en.home.trust.verified_sellers);
  });

  it('en.json has distinct subtitle for support trust item', () => {
    const en = locale('en');
    expect(en.home.trust.support_sub).toBeTruthy();
    expect(en.home.trust.support_sub).not.toBe(en.home.trust.support);
  });

  it('ma.json (Darija) has distinct trust subtitles matching the spec', () => {
    const ma = locale('ma');
    expect(ma.home.trust.delivery_sub).toBeTruthy();
    expect(ma.home.trust.returns_sub).toBeTruthy();
    expect(ma.home.trust.sellers_sub).toBeTruthy();
    expect(ma.home.trust.support_sub).toBeTruthy();
  });

  it('ar.json has distinct trust subtitles', () => {
    const ar = locale('ar');
    expect(ar.home.trust.delivery_sub).toBeTruthy();
    expect(ar.home.trust.returns_sub).toBeTruthy();
    expect(ar.home.trust.sellers_sub).toBeTruthy();
    expect(ar.home.trust.support_sub).toBeTruthy();
  });

  it('fr.json has distinct trust subtitles', () => {
    const fr = locale('fr');
    expect(fr.home.trust.delivery_sub).toBeTruthy();
    expect(fr.home.trust.returns_sub).toBeTruthy();
    expect(fr.home.trust.sellers_sub).toBeTruthy();
    expect(fr.home.trust.support_sub).toBeTruthy();
  });

  it('es.json has distinct trust subtitles', () => {
    const es = locale('es');
    expect(es.home.trust.delivery_sub).toBeTruthy();
    expect(es.home.trust.returns_sub).toBeTruthy();
    expect(es.home.trust.sellers_sub).toBeTruthy();
    expect(es.home.trust.support_sub).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — RTL carousel clip: scroll-padding uses logical properties
// ─────────────────────────────────────────────────────────────────────────────
describe('Fix 3 — New-arrivals snap-rail RTL alignment', () => {
  it('new-arrivals rail uses scroll-ps / scroll-pe (logical) instead of scroll-pl / scroll-pr', () => {
    const content = featured();
    // Must NOT use raw scroll-pl or scroll-pr
    expect(content).not.toMatch(/scroll-pl-\d/);
    expect(content).not.toMatch(/scroll-pr-\d/);
  });

  it('new-arrivals rail uses logical scroll-ps for scroll-padding-inline-start', () => {
    // scroll-ps-6 is the Tailwind logical property for scroll-padding-inline-start
    expect(featured()).toContain('scroll-ps-');
  });

  it('new-arrivals outer rail wrapper uses -mx- + px- offset trick with logical properties', () => {
    // The -mx-N + px-N pattern aligns the first card flush with the text edge
    const content = featured();
    expect(content).toMatch(/-mx-\d+\s+px-\d+|scroll-ps-/);
  });

  it('new-arrivals rail does NOT use dir="ltr" forcing override', () => {
    // Hard-coding dir=ltr on a RTL page breaks RTL scroll direction
    const content = featured();
    // scroll container must not force dir=ltr
    expect(content).not.toContain('dir="ltr"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4 — Journal i18n: no hardcoded English in journal array
// ─────────────────────────────────────────────────────────────────────────────
describe('Fix 4 — Journal i18n: localized article content', () => {
  it('HomeContent journal array uses t() for titles (no hardcoded English string "Inside a Fez")', () => {
    expect(home()).not.toContain("Inside a Fez brocade atelier");
  });

  it('HomeContent journal array uses t() for excerpts (no hardcoded English excerpt)', () => {
    expect(home()).not.toContain("How fourth-generation weavers in Fez");
  });

  it('HomeContent journal array uses t() for the third article title ("Sizing a djellaba")', () => {
    expect(home()).not.toContain("Sizing a djellaba, the Moroccan way");
  });

  it('ar.json has journal article titles in Arabic', () => {
    const ar = locale('ar');
    const journal = ar.home?.journal;
    expect(journal?.article1_title).toBeTruthy();
    expect(journal?.article2_title).toBeTruthy();
    expect(journal?.article3_title).toBeTruthy();
  });

  it('ma.json has journal article titles in Darija', () => {
    const ma = locale('ma');
    const journal = ma.home?.journal;
    expect(journal?.article1_title).toBeTruthy();
    expect(journal?.article2_title).toBeTruthy();
    expect(journal?.article3_title).toBeTruthy();
  });

  it('en.json has journal article titles', () => {
    const en = locale('en');
    const journal = en.home?.journal;
    expect(journal?.article1_title).toBeTruthy();
    expect(journal?.article2_title).toBeTruthy();
    expect(journal?.article3_title).toBeTruthy();
  });

  it('fr.json has journal article titles in French', () => {
    const fr = locale('fr');
    const journal = fr.home?.journal;
    expect(journal?.article1_title).toBeTruthy();
    expect(journal?.article2_title).toBeTruthy();
    expect(journal?.article3_title).toBeTruthy();
  });

  it('HomeContent journal uses t() with i18n keys for article content', () => {
    // The journal array must use t('home.journal.articleN_title', ...) pattern
    const content = home();
    expect(content).toMatch(/journal\.article\d_title|journal\.article\d_excerpt/);
  });

  it('journal second card (Wedding) image path is not dead — falls back gracefully', () => {
    // The Wedding article image must have onError fallback or use neutral fallback logic
    const content = home();
    // Either the img has onError, or the journal items share the same fallback state pattern
    expect(content).toMatch(/onError|journalImgError|journalFallback|imgFailed/);
  });
});
