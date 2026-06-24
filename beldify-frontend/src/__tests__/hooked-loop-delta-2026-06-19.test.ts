/**
 * Hooked Loop Delta — 2026-06-19
 *
 * TDD red-green gate for 4 surgical FE fixes from the Hooked audit:
 *   ITEM 1: PWA install modal re-enabled (no ?pwa=install gate in prod)
 *   ITEM 2: Wishlist guest→auth merge preserves notify flags + target_price
 *   ITEM 3: PostOrderPushPrompt uses t() — no raw Arabic literals
 *   ITEM 4: Reorder "Buy it again" uses t() — no inline ternary
 *
 * Ethics constraint: tests also assert no shame/urgency copy sneaked in.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const LOCALE_DIR = join(ROOT, 'src/i18n/locales');

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

// ─── ITEM 1: PWA install modal re-enabled ─────────────────────────────────────

describe('ITEM 1 — PWA install modal re-enabled in prod', () => {
  it('PWAProviderWrapper does not gate UI behind ?pwa=install query param', () => {
    const wrapper = read('src/providers/PWAProviderWrapper.tsx');
    // The gate must be gone: no URLSearchParams check for pwa=install
    const hasQueryGate =
      wrapper.includes("get('pwa') === 'install'") ||
      wrapper.includes('get("pwa") === "install"') ||
      wrapper.includes("showPwaUI");
    expect(
      hasQueryGate,
      'PWAProviderWrapper must not gate modal behind ?pwa=install'
    ).toBe(false);
  });

  it('ModernInstallPrompt does not short-circuit on !explicitOptIn', () => {
    const prompt = read('src/components/pwa/ModernInstallPrompt.tsx');
    // The secondary guard referencing explicitOptIn must be removed
    const hasOptInGuard =
      prompt.includes('explicitOptIn') ||
      prompt.includes("get('pwa') === 'install'") ||
      prompt.includes('get("pwa") === "install"');
    expect(
      hasOptInGuard,
      'ModernInstallPrompt must not block rendering with explicitOptIn guard'
    ).toBe(false);
  });

  it('ModernInstallPrompt still checks isInstalled to avoid prompting installed users', () => {
    const prompt = read('src/components/pwa/ModernInstallPrompt.tsx');
    expect(prompt).toContain('isInstalled');
  });

  it('ModernInstallPrompt still checks showInstallPrompt before rendering', () => {
    const prompt = read('src/components/pwa/ModernInstallPrompt.tsx');
    expect(prompt).toContain('showInstallPrompt');
  });

  it('ModernInstallPrompt or EnhancedPWAContext still checks 24h dismiss guard', () => {
    const prompt = read('src/components/pwa/ModernInstallPrompt.tsx');
    const pwaCtx = read('src/contexts/EnhancedPWAContext.tsx');
    const has24hGuard =
      prompt.includes('24') ||
      pwaCtx.includes('24') ||
      prompt.includes('pwa-remind-later') ||
      pwaCtx.includes('installDismissed') ||
      pwaCtx.includes('hoursSinceDismissed');
    expect(has24hGuard, '24-hour dismiss guard must remain').toBe(true);
  });

  it('scroll-triggered auto-show remains disabled in ModernInstallPrompt', () => {
    const prompt = read('src/components/pwa/ModernInstallPrompt.tsx');
    // The "Auto-show on scroll disabled" comment or equivalent should remain
    // We simply assert no scroll listener was added for auto-showing the modal
    const hasScrollAutoShow =
      prompt.includes("addEventListener('scroll'") &&
      prompt.includes('setShowInstallPrompt(true)');
    expect(hasScrollAutoShow, 'Scroll auto-show must remain disabled').toBe(false);
  });
});

// ─── ITEM 2: Wishlist merge preserves notify flags + target_price ──────────────

describe('ITEM 2 — Wishlist guest→auth merge forwards notify flags', () => {
  it('AuthContext merge POST does not hardcode notify_price_drop: false', () => {
    const auth = read('src/contexts/AuthContext.tsx');
    // The hardcoded false for notify_price_drop must be gone
    expect(auth).not.toContain('notify_price_drop: false');
  });

  it('AuthContext merge POST does not hardcode notify_back_in_stock: false', () => {
    const auth = read('src/contexts/AuthContext.tsx');
    expect(auth).not.toContain('notify_back_in_stock: false');
  });

  it('AuthContext merge POST reads notify flags from the guest item', () => {
    const auth = read('src/contexts/AuthContext.tsx');
    // Should forward item.notify_back_in_stock or item.notify_price_drop
    const forwardsFlags =
      auth.includes('item.notify_back_in_stock') ||
      auth.includes('item.notify_price_drop') ||
      auth.includes('notify_back_in_stock: item') ||
      auth.includes('notify_price_drop: item');
    expect(
      forwardsFlags,
      'Merge POST must forward stored notify flags from the guest item'
    ).toBe(true);
  });

  it('GuestWishlistItem type includes notify_back_in_stock field', () => {
    const guestWishlist = read('src/utils/guestWishlist.ts');
    expect(guestWishlist).toContain('notify_back_in_stock');
  });

  it('GuestWishlistItem type includes notify_price_drop field', () => {
    const guestWishlist = read('src/utils/guestWishlist.ts');
    expect(guestWishlist).toContain('notify_price_drop');
  });

  it('GuestWishlistItem type includes target_price field', () => {
    const guestWishlist = read('src/utils/guestWishlist.ts');
    expect(guestWishlist).toContain('target_price');
  });
});

// ─── ITEM 3: PostOrderPushPrompt uses t() ──────────────────────────────────────

describe('ITEM 3 — PostOrderPushPrompt i18n: no raw Arabic literals', () => {
  it('PostOrderPushPrompt does not contain raw Arabic title "تابع شحنتك عبر الإشعارات"', () => {
    const comp = read('src/components/pwa/PostOrderPushPrompt.tsx');
    expect(comp).not.toContain('تابع شحنتك عبر الإشعارات');
  });

  it('PostOrderPushPrompt does not contain raw Arabic loading "جارٍ التفعيل…"', () => {
    const comp = read('src/components/pwa/PostOrderPushPrompt.tsx');
    expect(comp).not.toContain('جارٍ التفعيل…');
  });

  it('PostOrderPushPrompt does not contain raw Arabic CTA "تفعيل الإشعارات"', () => {
    const comp = read('src/components/pwa/PostOrderPushPrompt.tsx');
    expect(comp).not.toContain('تفعيل الإشعارات');
  });

  it('PostOrderPushPrompt does not contain raw Arabic guest text "أنشئ حسابًا لمتابعة طلباتك"', () => {
    const comp = read('src/components/pwa/PostOrderPushPrompt.tsx');
    expect(comp).not.toContain('أنشئ حسابًا لمتابعة طلباتك');
  });

  it('PostOrderPushPrompt does not contain raw Arabic guest CTA "إنشاء حساب"', () => {
    const comp = read('src/components/pwa/PostOrderPushPrompt.tsx');
    expect(comp).not.toContain('إنشاء حساب');
  });

  it('PostOrderPushPrompt uses t() for translations', () => {
    const comp = read('src/components/pwa/PostOrderPushPrompt.tsx');
    expect(comp).toContain("t('post_order_push.");
  });

  it('PostOrderPushPrompt imports useTranslation', () => {
    const comp = read('src/components/pwa/PostOrderPushPrompt.tsx');
    expect(comp).toContain('useTranslation');
  });

  const POST_ORDER_KEYS = [
    'post_order_push.title',
    'post_order_push.subtitle',
    'post_order_push.enable_cta',
    'post_order_push.enabling',
    'post_order_push.enable_aria',
    'post_order_push.guest_title',
    'post_order_push.guest_cta',
    'post_order_push.guest_aria',
  ];

  for (const locale of ALL_LOCALES) {
    for (const key of POST_ORDER_KEYS) {
      it(`${locale}.json has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }

  it('EN post_order_push.title is calm and value-framed (no "!")', () => {
    const en = readLocale('en');
    const title = getNestedValue(en, 'post_order_push.title') as string;
    expect(title).not.toContain('!');
  });

  it('AR post_order_push copy uses Arabic script', () => {
    const ar = readLocale('ar');
    const title = getNestedValue(ar, 'post_order_push.title') as string;
    expect(title).toMatch(/[؀-ۿ]/);
  });
});

// ─── ITEM 4: Reorder "Buy it again" uses t() ──────────────────────────────────

describe('ITEM 4 — Reorder Buy-it-again i18n', () => {
  it('orders/page.tsx does not use inline language ternary for buy_again', () => {
    const page = read('src/app/orders/page.tsx');
    // The ternary based on i18n.language for 'ar' or 'ma' must be gone
    const hasTernary =
      page.includes("i18n.language === 'ar' || i18n.language === 'ma') ? 'اشترِ مرة أخرى'") ||
      page.includes("i18n.language === 'ar' || i18n.language === 'ma') ? \"اشترِ مرة أخرى\"");
    expect(hasTernary, 'orders/page.tsx must use t() not a language ternary').toBe(false);
  });

  it('orders/[orderNumber]/page.tsx does not use inline language ternary for buy_again', () => {
    const page = read('src/app/orders/[orderNumber]/page.tsx');
    const hasTernary =
      page.includes("i18n.language === 'ar' || i18n.language === 'ma') ? 'اشترِ مرة أخرى'") ||
      page.includes("i18n.language === 'ar' || i18n.language === 'ma') ? \"اشترِ مرة أخرى\"");
    expect(hasTernary, 'orders/[orderNumber]/page.tsx must use t() not a language ternary').toBe(false);
  });

  it('orders/page.tsx uses t("orders.actions.buy_again") for button label', () => {
    const page = read('src/app/orders/page.tsx');
    expect(page).toContain("t('orders.actions.buy_again')");
  });

  it('orders/[orderNumber]/page.tsx uses t("orders.actions.buy_again") for button label', () => {
    const page = read('src/app/orders/[orderNumber]/page.tsx');
    expect(page).toContain("t('orders.actions.buy_again')");
  });

  const BUY_AGAIN_KEY = 'orders.actions.buy_again';

  for (const locale of ALL_LOCALES) {
    it(`${locale}.json has ${BUY_AGAIN_KEY}`, () => {
      const data = readLocale(locale);
      const value = getNestedValue(data, BUY_AGAIN_KEY);
      expect(value, `${locale}.${BUY_AGAIN_KEY} must be a non-empty string`).toBeTruthy();
      expect(typeof value).toBe('string');
    });
  }

  it('AR buy_again uses Arabic script', () => {
    const ar = readLocale('ar');
    const val = getNestedValue(ar, BUY_AGAIN_KEY) as string;
    expect(val).toMatch(/[؀-ۿ]/);
  });

  it('MA buy_again uses Arabic script (mirrors AR)', () => {
    const ma = readLocale('ma');
    const val = getNestedValue(ma, BUY_AGAIN_KEY) as string;
    expect(val).toMatch(/[؀-ۿ]/);
  });

  it('EN buy_again has no exclamation mark (calm copy)', () => {
    const en = readLocale('en');
    const val = getNestedValue(en, BUY_AGAIN_KEY) as string;
    expect(val).not.toContain('!');
  });
});
