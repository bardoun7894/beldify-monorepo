/**
 * P1 Marketplace FE fixes — TDD Red-Green gate
 *
 * Covers:
 *   P1-2  PayPal/Card "coming soon" gate in checkout
 *   P1-3  Shipping copy i18n (shipping method name + ETA keys)
 *   P1-4  products.results plural forms
 *   P1-5  TryOnModal AI approximation disclaimer
 *   P1-6  Tap-target size bumps (44px)
 *   P1-7  AI review gist in buy column
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const LOCALE_DIR = join(ROOT, 'src/i18n/locales');
const SRC = join(ROOT, 'src');

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

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

const ALL_LOCALES = ['en', 'ar', 'fr', 'ma', 'es', 'nl', 'de'];

// ─── P1-2: PayPal/Card gated in checkout ──────────────────────────────────────

describe('P1-2 — PayPal/Card coming-soon gate in checkout', () => {
  const checkout = read('src/app/checkout/page.tsx');

  it('gateway methods return null or are hidden (not just disabled-reason)', () => {
    // Either the gateway methods are filtered out of getPaymentMethods() result,
    // OR paymentDisabledReason returns a non-null reason for kind=gateway.
    // The simplest proof: paymentDisabledReason must handle kind === 'gateway'
    const hasGatewayGuard =
      checkout.includes("method.kind === 'gateway'") ||
      checkout.includes('coming_soon') ||
      checkout.includes('comingSoon') ||
      checkout.includes('gateway_coming_soon');
    expect(hasGatewayGuard).toBe(true);
  });

  it('i18n key checkout.payment.gateway_coming_soon present in en.json', () => {
    const en = readLocale('en');
    const val = getNestedValue(en, 'checkout.payment.gateway_coming_soon');
    expect(val, 'checkout.payment.gateway_coming_soon must exist in en').toBeTruthy();
  });

  it('i18n key checkout.payment.gateway_coming_soon present in ar.json', () => {
    const ar = readLocale('ar');
    const val = getNestedValue(ar, 'checkout.payment.gateway_coming_soon');
    expect(val, 'checkout.payment.gateway_coming_soon must exist in ar').toBeTruthy();
  });
});

// ─── P1-3: Shipping copy i18n ─────────────────────────────────────────────────

describe('P1-3 — Shipping method name + ETA i18n keys', () => {
  const SHIPPING_KEYS = [
    'checkout.shipping.methods.standard.name',
    'checkout.shipping.methods.standard.eta',
    'checkout.shipping.methods.express.name',
    'checkout.shipping.methods.express.eta',
    'checkout.shipping.methods.pickup.name',
    'checkout.shipping.methods.pickup.eta',
  ];

  for (const locale of ALL_LOCALES) {
    for (const key of SHIPPING_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be non-empty`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }

  it('checkout page uses t() for shipping method name', () => {
    const checkout = read('src/app/checkout/page.tsx');
    // name field should be wrapped in t() using the shipping method key
    expect(checkout).toMatch(/checkout\.shipping\.methods\./);
  });
});

// ─── P1-4: products.results plural forms ──────────────────────────────────────

describe('P1-4 — products.results plural forms', () => {
  it('en.json has products.results_one', () => {
    const en = readLocale('en');
    const val = getNestedValue(en, 'products.results_one');
    expect(val, 'products.results_one must exist in en').toBeTruthy();
  });

  it('en.json has products.results_other', () => {
    const en = readLocale('en');
    const val = getNestedValue(en, 'products.results_other');
    expect(val, 'products.results_other must exist in en').toBeTruthy();
  });

  it('ar.json has products.results_one', () => {
    const ar = readLocale('ar');
    const val = getNestedValue(ar, 'products.results_one');
    expect(val, 'products.results_one must exist in ar').toBeTruthy();
  });

  it('ar.json has products.results_other (Arabic plural)', () => {
    const ar = readLocale('ar');
    const val = getNestedValue(ar, 'products.results_other');
    expect(val, 'products.results_other must exist in ar').toBeTruthy();
  });

  it('ma.json has products.results_one', () => {
    const ma = readLocale('ma');
    const val = getNestedValue(ma, 'products.results_one');
    expect(val, 'products.results_one must exist in ma').toBeTruthy();
  });

  it('ma.json has products.results_other', () => {
    const ma = readLocale('ma');
    const val = getNestedValue(ma, 'products.results_other');
    expect(val, 'products.results_other must exist in ma').toBeTruthy();
  });

  for (const locale of ['fr', 'es', 'nl', 'de']) {
    it(`${locale}.json has products.results_one`, () => {
      const data = readLocale(locale);
      const val = getNestedValue(data, 'products.results_one');
      expect(val, `products.results_one must exist in ${locale}`).toBeTruthy();
    });

    it(`${locale}.json has products.results_other`, () => {
      const data = readLocale(locale);
      const val = getNestedValue(data, 'products.results_other');
      expect(val, `products.results_other must exist in ${locale}`).toBeTruthy();
    });
  }

  it('products/page.tsx calls t with count option for pluralization', () => {
    const page = read('src/app/products/page.tsx');
    // Must use { count: ... } to trigger i18next plural resolution
    expect(page).toMatch(/t\(['"]products\.results['"]\s*,\s*\{[^}]*count/);
  });
});

// ─── P1-5: TryOnModal AI disclaimer ────────────────────────────────────────────

describe('P1-5 — TryOnModal AI approximation disclaimer', () => {
  const tryon = read('src/components/buyer-ai/TryOnModal.tsx');

  it('renders a disclaimer caption after the result image', () => {
    // Check that tryon.disclaimer key is used
    expect(tryon).toMatch(/tryon\.disclaimer/);
  });

  it('tryon.disclaimer present in en.json', () => {
    const en = readLocale('en');
    const val = getNestedValue(en, 'tryon.disclaimer');
    expect(val, 'tryon.disclaimer must exist in en').toBeTruthy();
    expect(val as string).toMatch(/AI/i);
  });

  it('tryon.disclaimer present in ar.json (Arabic text)', () => {
    const ar = readLocale('ar');
    const val = getNestedValue(ar, 'tryon.disclaimer');
    expect(val, 'tryon.disclaimer must exist in ar').toBeTruthy();
    // Should contain Arabic text
    expect(val as string).toMatch(/[؀-ۿ]/);
  });

  for (const locale of ALL_LOCALES) {
    it(`${locale} has tryon.disclaimer`, () => {
      const data = readLocale(locale);
      const val = getNestedValue(data, 'tryon.disclaimer');
      expect(val, `tryon.disclaimer must exist in ${locale}`).toBeTruthy();
    });
  }
});

// ─── P1-6: Tap targets ────────────────────────────────────────────────────────

describe('P1-6 — 44px tap targets', () => {
  it('ProductCard add-to-cart button has min-h-[44px] or min-w-[44px]', () => {
    const card = read('src/components/products/ProductCard.tsx');
    expect(card).toMatch(/min-[hw]-\[44px\]/);
  });

  it('Pagination buttons have min-h-[44px] or min-w-[44px]', () => {
    const pagination = read('src/components/common/Pagination.tsx');
    expect(pagination).toMatch(/min-[hw]-\[44px\]/);
  });

  it('products/page.tsx sort chips have min-h-[44px]', () => {
    const page = read('src/app/products/page.tsx');
    // Sort chips should be at least 44px
    expect(page).toMatch(/min-h-\[44px\]/);
  });
});

// ─── P1-7: AI review gist in buy column ───────────────────────────────────────

describe('P1-7 — AI review gist surfaced in buy column', () => {
  const pdp = read('src/app/products/[id]/page.tsx');

  it('renders AiReviewGist component or inline gist in buy column', () => {
    // Either an AiReviewGist component or a compact inline summary
    const hasGist =
      pdp.includes('AiReviewGist') ||
      pdp.includes('aiReviewGist') ||
      pdp.includes('ai_gist') ||
      pdp.includes('compact') ||
      pdp.includes('gist');
    expect(hasGist).toBe(true);
  });

  it('gist only renders when reviews_count >= 3', () => {
    // The condition checks reviews_count >= 3 (or > 2)
    const hasCountGuard =
      pdp.includes('reviews_count >= 3') ||
      pdp.includes('reviews_count > 2') ||
      pdp.includes('review_count >= 3') ||
      pdp.includes('review_count > 2');
    expect(hasCountGuard).toBe(true);
  });

  it('gist uses buyerAi.reviewSummary.header or pdp.aiGist i18n key', () => {
    const hasI18n =
      pdp.includes('buyerAi.reviewSummary') ||
      pdp.includes('pdp.aiGist') ||
      pdp.includes('pdp.ai_gist');
    expect(hasI18n).toBe(true);
  });
});
