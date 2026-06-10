/**
 * TDD tests for PACKET FE-ORDERS fixes.
 * RED: written before production code changes; should all fail initially.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const detailPage = readFileSync(join(ROOT, 'src/app/orders/[orderNumber]/page.tsx'), 'utf-8');
const ordersPage = readFileSync(join(ROOT, 'src/app/orders/page.tsx'), 'utf-8');
const pdpPage    = readFileSync(join(ROOT, 'src/app/products/[id]/page.tsx'), 'utf-8');

const enJson  = JSON.parse(readFileSync(join(ROOT, 'src/i18n/locales/en.json'),  'utf-8'));
const arJson  = JSON.parse(readFileSync(join(ROOT, 'src/i18n/locales/ar.json'),  'utf-8'));
const frJson  = JSON.parse(readFileSync(join(ROOT, 'src/i18n/locales/fr.json'),  'utf-8'));
const esJson  = JSON.parse(readFileSync(join(ROOT, 'src/i18n/locales/es.json'),  'utf-8'));
const maJson  = JSON.parse(readFileSync(join(ROOT, 'src/i18n/locales/ma.json'),  'utf-8'));

// ── Fix 1a: "Write a review" button removed (no backend endpoint) ───────────

describe('Fix 1a — write review button hidden', () => {
  it('orders/[orderNumber]/page.tsx does not render a clickable write-review button', () => {
    // The button with write_review action should NOT be a live <button> element
    // (it should be absent or only appear as a comment)
    const buttonMatches = detailPage.match(/<button[^>]*write_review[^>]*>/g) || [];
    expect(buttonMatches.length).toBe(0);
  });

  it('orders/[orderNumber]/page.tsx has a comment about review endpoint deferral', () => {
    // A comment should explain why the button is hidden
    expect(detailPage).toMatch(/review.*backend|backend.*review/i);
  });
});

// ── Fix 1b: Contact Support buttons wired to WhatsApp ────────────────────────

describe('Fix 1b — Contact Support wires to WhatsApp', () => {
  it('orders/[orderNumber]/page.tsx has SUPPORT_WHATSAPP constant or wa.me href', () => {
    expect(detailPage).toMatch(/wa\.me|SUPPORT_WHATSAPP|SUPPORT_PHONE/);
  });

  it('orders/[orderNumber]/page.tsx contact-support buttons have onClick opening WhatsApp', () => {
    // Should use window.open or direct href with wa.me
    expect(detailPage).toMatch(/wa\.me|window\.open/);
  });

  it('orders/[orderNumber]/page.tsx has aria-label for each contact support button', () => {
    // aria-label should reference support context
    const supportAriaMatches = (detailPage.match(/aria-label=\{t\('orders\.actions\.support'|aria-label=\{t\('orders\.actions\.contact_support'/g) || []).length;
    expect(supportAriaMatches).toBeGreaterThanOrEqual(1);
  });
});

// ── Fix 1c: Totals panel — real subtotal and shipping_amount ─────────────────

describe('Fix 1c — totals panel shows real subtotal', () => {
  it('orders/[orderNumber]/page.tsx computes items subtotal via reduce', () => {
    // Must compute subtotal from items reduce, not just use total_amount for subtotal row
    expect(detailPage).toMatch(/\.reduce\(|items\.reduce\(/);
  });

  it('orders/[orderNumber]/page.tsx renders order.shipping_amount for shipping row', () => {
    expect(detailPage).toMatch(/shipping_amount/);
  });

  it('orders/[orderNumber]/page.tsx shows Free/مجاني when shipping_amount is 0', () => {
    // Should check for zero and show free
    expect(detailPage).toMatch(/shipping_amount.*===.*0|=== 0.*shipping|orders\.summary\.free/);
  });
});

// ── Fix 1d: Reorder toasts use i18n keys in orders/[orderNumber]/page.tsx ────

describe('Fix 1d — reorder toasts use t() in orders/[orderNumber]/page.tsx', () => {
  it('does not use ternary-language pattern for all_skipped toast (must use t())', () => {
    // Old: toast(i18n.language === 'ar' ? '...' : '...', 'error') as bare toast call
    expect(detailPage).not.toMatch(/toast\(\s*i18n\.language\s*===\s*'ar'\s*\?[^)]*all_skipped/);
  });

  it('does not use bare toast() call with parenthesised concat (must use toast.success)', () => {
    // Old: toast((i18n.language === 'ar' ? ... : ...) + skippedNote, 'success')
    expect(detailPage).not.toMatch(/toast\(\s*\(/);
  });

  it('uses toast.error() for error cases', () => {
    expect(detailPage).toContain('toast.error(');
  });

  it('uses toast.success() for success case', () => {
    expect(detailPage).toContain('toast.success(');
  });

  it('uses t() for orders.reorder.added', () => {
    expect(detailPage).toContain("orders.reorder.added");
  });

  it('uses t() for orders.reorder.all_skipped', () => {
    expect(detailPage).toContain("orders.reorder.all_skipped");
  });

  it('uses t() for orders.reorder.error', () => {
    expect(detailPage).toContain("orders.reorder.error");
  });
});

// ── Fix 2: Reorder toasts use i18n keys in orders/page.tsx ───────────────────

describe('Fix 2 — reorder toasts use t() in orders/page.tsx', () => {
  it('does not use ternary-language pattern for all_skipped toast message (must use t())', () => {
    // Old pattern: toast(i18n.language === 'ar' ? '...' : '...', 'error')
    // New pattern: toast.error(t('orders.reorder.all_skipped', '...'))
    // Check that the direct ternary toast call is gone
    expect(ordersPage).not.toMatch(/toast\(\s*i18n\.language\s*===\s*'ar'\s*\?[^)]*all_skipped/);
  });

  it('does not use bare toast() call with AR string for added toast (must use toast.success)', () => {
    // Old: toast((i18n.language === 'ar' ? 'أُضيف' : 'Added') + skippedNote, 'success')
    expect(ordersPage).not.toMatch(/toast\(\s*\(/);
  });

  it('uses t() for orders.reorder.added', () => {
    expect(ordersPage).toContain("orders.reorder.added");
  });

  it('uses t() for orders.reorder.all_skipped', () => {
    expect(ordersPage).toContain("orders.reorder.all_skipped");
  });

  it('uses t() for orders.reorder.error', () => {
    expect(ordersPage).toContain("orders.reorder.error");
  });

  it('uses toast.error() for error toasts (not bare toast())', () => {
    expect(ordersPage).toContain('toast.error(');
  });

  it('uses toast.success() for success toasts (not bare toast())', () => {
    expect(ordersPage).toContain('toast.success(');
  });

  it('syncUrlLocale called without arguments', () => {
    // syncUrlLocale() takes no params — must not pass i18n.language
    expect(ordersPage).not.toMatch(/syncUrlLocale\(i18n\.language\)/);
  });

  it('OrdersLoadingScreen not passed isRTL prop', () => {
    // OrdersLoadingScreen only accepts title and message
    expect(ordersPage).not.toMatch(/OrdersLoadingScreen[^>]*isRTL/);
  });
});

// ── Fix 3a: PDP — no /journal link ───────────────────────────────────────────

describe('Fix 3a — PDP has no /journal link', () => {
  it('does not link to /journal route', () => {
    expect(pdpPage).not.toMatch(/href=.*\/journal/);
  });

  it('does not render from_the_journal translation key', () => {
    expect(pdpPage).not.toContain('journal.from_the_journal');
  });
});

// ── Fix 3b: PDP — no generic artisan paragraph ───────────────────────────────

describe('Fix 3b — PDP has no generic crafted-by-artisans paragraph', () => {
  it('does not render product.description_secondary translation key', () => {
    expect(pdpPage).not.toContain('product.description_secondary');
  });

  it('does not contain the hardcoded artisan fallback string', () => {
    expect(pdpPage).not.toContain('Crafted by skilled artisans using traditional methods');
  });
});

// ── Fix 3c: PDP — WCAG contrast: text-gray-500 on struck price ───────────────

describe('Fix 3c — struck-through price uses text-gray-500 not text-gray-400', () => {
  it('original/struck-through price uses text-gray-500', () => {
    // The line-through price span should be gray-500
    expect(pdpPage).toMatch(/line-through[^"]*text-gray-500|text-gray-500[^"]*line-through/);
  });

  it('struck-through price does not use text-gray-400', () => {
    // Check that the line-through context doesn't have gray-400
    const ltMatches = pdpPage.match(/line-through[^\n]*/g) || [];
    ltMatches.forEach(line => {
      expect(line).not.toContain('text-gray-400');
    });
  });
});

// ── i18n keys present in all 5 locales ───────────────────────────────────────

describe('i18n — reorder keys present in all 5 locale files', () => {
  const locales: Array<[string, Record<string, unknown>]> = [
    ['en', enJson], ['ar', arJson], ['fr', frJson], ['es', esJson], ['ma', maJson],
  ];

  for (const [lang, dict] of locales) {
    it(`${lang}.json has orders.reorder.added`, () => {
      expect((dict as any)?.orders?.reorder?.added).toBeTruthy();
    });

    it(`${lang}.json has orders.reorder.all_skipped`, () => {
      expect((dict as any)?.orders?.reorder?.all_skipped).toBeTruthy();
    });

    it(`${lang}.json has orders.reorder.error`, () => {
      expect((dict as any)?.orders?.reorder?.error).toBeTruthy();
    });
  }
});
