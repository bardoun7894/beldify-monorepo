/**
 * i18n expansion wiring — TDD Red-Green gate (feat/ai-seller-credits)
 *
 * Tasks covered:
 *   1. nl + de registered in i18n config
 *   2. nl + de in middleware LOCALES
 *   3. LanguageSwitcher has nl/de entries, no next/image flag references
 *   4. LanguageSuggestionBanner — suggestLocale pure-function contract
 *   5. locale forwarded in DiscoverFeed (no hardcoded locale=ma)
 *   6. products/page SORT_OPTIONS use products.sort.* keys
 *   7. sort-keys.json cache artifact produced with 7 locales
 *   8. axiosInstance has Accept-Language interceptor
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { suggestLocale } from '@/utils/suggestLocale';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ─── Task 1: nl + de in i18n config ──────────────────────────────────────────

describe('Task 1 — nl + de registered in i18n/config.ts', () => {
  const config = read('src/i18n/config.ts');

  it('imports nl locale JSON', () => {
    expect(config).toMatch(/import\s+nl\s+from\s+['"]\.\/locales\/nl\.json['"]/);
  });

  it('imports de locale JSON', () => {
    expect(config).toMatch(/import\s+de\s+from\s+['"]\.\/locales\/de\.json['"]/);
  });

  it('adds nl to resources', () => {
    expect(config).toMatch(/nl\s*:/);
  });

  it('adds de to resources', () => {
    expect(config).toMatch(/de\s*:/);
  });

  it('uses object form for fallbackLng (not array)', () => {
    // Object form: fallbackLng: { ... }  vs array form: fallbackLng: [...]
    expect(config).toMatch(/fallbackLng\s*:\s*\{/);
    // Should NOT have the bare array form
    expect(config).not.toMatch(/fallbackLng\s*:\s*\[/);
  });

  it('nl falls back to en', () => {
    expect(config).toMatch(/nl\s*:\s*\[\s*['"]en['"]\s*\]/);
  });

  it('de falls back to en', () => {
    expect(config).toMatch(/de\s*:\s*\[\s*['"]en['"]\s*\]/);
  });

  it('lng stays ma (Darija default preserved)', () => {
    expect(config).toMatch(/lng\s*:\s*'ma'/);
  });

  it('RTL_LANGUAGES still only ar and ma', () => {
    // RTL_LANGUAGES should NOT include nl or de
    const m = config.match(/RTL_LANGUAGES\s*=\s*\[([^\]]*)\]/);
    expect(m).toBeTruthy();
    const langs = m![1];
    expect(langs).not.toContain('nl');
    expect(langs).not.toContain('de');
    expect(langs).toContain('ar');
    expect(langs).toContain('ma');
  });
});

// ─── Task 2: middleware LOCALES includes nl + de ──────────────────────────────

describe('Task 2 — middleware LOCALES includes nl and de', () => {
  const mw = read('src/middleware.ts');

  it("includes 'nl' in LOCALES", () => {
    expect(mw).toMatch(/'nl'/);
  });

  it("includes 'de' in LOCALES", () => {
    expect(mw).toMatch(/'de'/);
  });
});

// ─── Task 3: LanguageSwitcher — nl/de entries, no next/image flags ────────────

describe('Task 3 — LanguageSwitcher has nl/de and no next/image flag', () => {
  const switcher = read('src/components/common/LanguageSwitcher.tsx');

  it("has nl entry with name 'Nederlands'", () => {
    expect(switcher).toContain('Nederlands');
  });

  it("has de entry with name 'Deutsch'", () => {
    expect(switcher).toContain('Deutsch');
  });

  it('does not import next/image', () => {
    expect(switcher).not.toMatch(/from\s+['"]next\/image['"]/);
  });

  it('does not reference /images/flags/', () => {
    expect(switcher).not.toContain('/images/flags/');
  });

  it('renders a typographic chip (uppercase 2-letter code) rather than an image', () => {
    // Must contain toUpperCase() or the 2-letter codes as static strings
    const hasUpperCode =
      switcher.includes('toUpperCase') ||
      switcher.includes('.toLocaleUpperCase') ||
      // OR static uppercase codes rendered directly
      (switcher.includes('"MA"') || switcher.includes('"EN"') ||
       switcher.includes("'MA'") || switcher.includes("'EN'") ||
       switcher.includes('.toUpperCase()'));
    expect(hasUpperCode).toBe(true);
  });

  it('uses hsl(var(--secondary)) or Atlas indigo token for chip background', () => {
    expect(switcher).toMatch(/hsl\(var\(--secondary/);
  });
});

// ─── Task 4: LanguageSuggestionBanner — suggestLocale pure function ────────────

describe('Task 4 — LanguageSuggestionBanner suggestLocale function', () => {
  // Pure function imported directly from utility module (no React/browser deps).

  it('exports suggestLocale as a function', () => {
    expect(typeof suggestLocale).toBe('function');
  });

  it('maps ar-MA to ma', () => {
    expect(suggestLocale(['ar-MA', 'ar'], 'en')).toBe('ma');
  });

  it('maps nl-NL to nl', () => {
    expect(suggestLocale(['nl-NL', 'en'], 'en')).toBe('nl');
  });

  it('maps de-DE to de', () => {
    expect(suggestLocale(['de-DE', 'fr'], 'en')).toBe('de');
  });

  it('maps fr-FR to fr', () => {
    expect(suggestLocale(['fr-FR'], 'en')).toBe('fr');
  });

  it('maps en-US to en', () => {
    expect(suggestLocale(['en-US'], 'ma')).toBe('en');
  });

  it('returns null when suggestion matches current language', () => {
    expect(suggestLocale(['nl'], 'nl')).toBeNull();
  });

  it('returns null for unsupported language', () => {
    expect(suggestLocale(['ja-JP', 'zh-CN'], 'ma')).toBeNull();
  });

  it('returns null for empty navigator.languages', () => {
    expect(suggestLocale([], 'ma')).toBeNull();
  });
});

// ─── Task 4: LanguageSuggestionBanner file structure ─────────────────────────

describe('Task 4 — LanguageSuggestionBanner file exists and is wired into layout-client', () => {
  it('LanguageSuggestionBanner.tsx file exists', () => {
    const exists = existsSync(join(SRC, 'components/common/LanguageSuggestionBanner.tsx'));
    expect(exists).toBe(true);
  });

  it('layout-client.tsx imports LanguageSuggestionBanner', () => {
    const layout = read('src/app/layout-client.tsx');
    expect(layout).toContain('LanguageSuggestionBanner');
  });

  it('LanguageSuggestionBanner renders above Navbar in layout-client', () => {
    const layout = read('src/app/layout-client.tsx');
    const bannerIdx = layout.indexOf('LanguageSuggestionBanner');
    const navbarIdx = layout.indexOf('<Navbar');
    expect(bannerIdx).toBeGreaterThan(-1);
    expect(navbarIdx).toBeGreaterThan(-1);
    expect(bannerIdx).toBeLessThan(navbarIdx);
  });
});

// ─── Task 5: locale param forwarded in DiscoverFeed ───────────────────────────

describe('Task 5 — DiscoverFeed uses dynamic i18n language (not hardcoded ma)', () => {
  const feed = read('src/components/home/DiscoverFeed.tsx');

  it('does not hardcode locale=ma in the SWR key', () => {
    // Should not have the literal string locale=ma in the URL template
    expect(feed).not.toContain('locale=ma');
  });

  it('uses i18n.language in the URL', () => {
    expect(feed).toMatch(/i18n\.language/);
  });
});

// ─── Task 5: axiosInstance Accept-Language interceptor ───────────────────────

describe('Task 5 — axiosInstance sets Accept-Language from i18n', () => {
  const axios = read('src/services/axiosInstance.ts');

  it('imports i18n instance', () => {
    expect(axios).toMatch(/from\s+['"]@\/i18n\/config['"]/);
  });

  it("sets 'Accept-Language' header in interceptor", () => {
    expect(axios).toContain('Accept-Language');
  });

  it('guards typeof window before reading i18n language', () => {
    expect(axios).toContain("typeof window !== 'undefined'");
  });
});

// ─── Task 6: SORT_OPTIONS use products.sort.* keys ───────────────────────────

describe('Task 6 — SORT_OPTIONS use products.sort.* keys', () => {
  // Spec 010: sort options were extracted from page.tsx into sortConfig.ts.
  const page = read('src/app/products/sortConfig.ts');

  it("uses 'products.sort.newest' key", () => {
    expect(page).toContain('products.sort.newest');
  });

  it("uses 'products.sort.price_low' or 'products.sort.price_asc' key", () => {
    const hasPriceLow = page.includes('products.sort.price_low') || page.includes('products.sort.price_asc');
    expect(hasPriceLow).toBe(true);
  });

  it("uses 'products.sort.price_high' or 'products.sort.price_desc' key", () => {
    const hasPriceHigh = page.includes('products.sort.price_high') || page.includes('products.sort.price_desc');
    expect(hasPriceHigh).toBe(true);
  });

  it("uses 'products.sort.popular' or 'products.sort.top_rated' key", () => {
    const hasPopular = page.includes('products.sort.popular') || page.includes('products.sort.top_rated');
    expect(hasPopular).toBe(true);
  });

  it('does NOT use old bare sort.* keys at top level', () => {
    // The old keys were 'sort.newest', 'sort.price_asc', etc. — they should be replaced
    expect(page).not.toMatch(/'sort\.newest'/);
    expect(page).not.toMatch(/'sort\.price_asc'/);
    expect(page).not.toMatch(/'sort\.price_desc'/);
    expect(page).not.toMatch(/'sort\.top_rated'/);
  });
});

// ─── Task 7: sort-keys.json cache artifact ───────────────────────────────────

describe('Task 7 — .cache/i18n-work/extra/sort-keys.json', () => {
  it('sort-keys.json file exists', () => {
    const exists = existsSync(join(ROOT, '.cache/i18n-work/extra/sort-keys.json'));
    expect(exists).toBe(true);
  });

  it('contains all 7 locales', () => {
    const raw = read('.cache/i18n-work/extra/sort-keys.json');
    const data = JSON.parse(raw);
    const locales = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'];
    for (const loc of locales) {
      expect(data, `missing locale: ${loc}`).toHaveProperty(loc);
    }
  });

  it('each locale has all 4 sort keys in dot-notation', () => {
    const raw = read('.cache/i18n-work/extra/sort-keys.json');
    const data = JSON.parse(raw);
    const expectedKeys = [
      'products.sort.newest',
      'products.sort.price_low',
      'products.sort.price_high',
      'products.sort.popular',
    ];
    for (const [, keys] of Object.entries(data)) {
      for (const k of expectedKeys) {
        expect(keys as Record<string, string>).toHaveProperty(k);
        expect(typeof (keys as Record<string, string>)[k]).toBe('string');
        expect((keys as Record<string, string>)[k].length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Tasks 9-21: hardcoded string → t() wiring ───────────────────────────────
// These tests are static source-text assertions (no JSX render needed).
// They fail RED until each component is wired.

// Task 9 — TypingIndicator
describe('Task 9 — TypingIndicator uses t() for aria-label', () => {
  const file = read('src/components/messaging/TypingIndicator.tsx');

  it('imports useTranslation', () => {
    expect(file).toMatch(/from\s+['"]react-i18next['"]/);
    expect(file).toContain('useTranslation');
  });

  it("uses t('messages.typing_aria'", () => {
    expect(file).toContain("t('messages.typing_aria'");
  });

  it('does NOT have a hardcoded aria-label "The other person is typing"', () => {
    // After wiring the value must come from t(), not inline
    expect(file).not.toContain('"The other person is typing"');
  });
});

// Task 10 — FloatingSupportButton
describe('Task 10 — FloatingSupportButton uses t() for "Need Help?"', () => {
  const file = read('src/components/support/FloatingSupportButton.tsx');

  it('imports useTranslation', () => {
    expect(file).toContain('useTranslation');
  });

  it("uses t('common.need_help'", () => {
    expect(file).toContain("t('common.need_help'");
  });

  it('does NOT have hardcoded "Need Help?" string', () => {
    expect(file).not.toContain('"Need Help?"');
  });
});

// Task 11 — ErrorMessage (ui/ErrorMessage.tsx)
describe('Task 11 — ui/ErrorMessage uses t() for "Try Again" button', () => {
  const file = read('src/components/ui/ErrorMessage.tsx');

  it('imports useTranslation', () => {
    expect(file).toContain('useTranslation');
  });

  it("uses t('common.try_again'", () => {
    expect(file).toContain("t('common.try_again'");
  });

  it('does NOT have hardcoded "Try Again" button label', () => {
    expect(file).not.toContain('>Try Again<');
  });
});

// Task 12 — error.tsx (ui/error.tsx)
describe('Task 12 — ui/error.tsx uses t() for "Try Again" button', () => {
  const file = read('src/components/ui/error.tsx');

  it('imports useTranslation', () => {
    expect(file).toContain('useTranslation');
  });

  it("uses t('common.try_again'", () => {
    expect(file).toContain("t('common.try_again'");
  });

  it('does NOT have hardcoded "Try Again" button label', () => {
    expect(file).not.toContain('>Try Again<');
  });
});

// Task 13 — SubcategoriesGrid
describe('Task 13 — SubcategoriesGrid uses t() for "View all" link', () => {
  const file = read('src/components/home/SubcategoriesGrid.tsx');

  it('imports useTranslation', () => {
    expect(file).toContain('useTranslation');
  });

  it("uses t('common.viewAll'", () => {
    expect(file).toContain("t('common.viewAll'");
  });

  it('does NOT have a bare JSX text node "View all" outside of t()', () => {
    // Allow "View all" as a t() fallback arg but not as a bare JSX text node
    expect(file).not.toMatch(/>\s*View all\s*</);
    // And not as a standalone string literal (outside t() context)
    // The only legal form is t('common.viewAll', 'View all')
    expect(file).toContain("t('common.viewAll'");
  });
});

// Task 14 — Hero.tsx banner alt
describe('Task 14 — Hero.tsx uses t() for main banner alt text', () => {
  const file = read('src/components/home/Hero.tsx');

  it("uses t('hero.banner_alt'", () => {
    expect(file).toContain("t('hero.banner_alt'");
  });

  it('does NOT have hardcoded alt="Caftan Collection"', () => {
    expect(file).not.toContain('alt="Caftan Collection"');
  });
});

// Task 15 — HeroContent.tsx atelier alt
describe('Task 15 — HeroContent.tsx uses t() for atelier alt text', () => {
  const file = read('src/components/home/HeroContent.tsx');

  it("uses t('hero.atelier_alt'", () => {
    expect(file).toContain("t('hero.atelier_alt'");
  });

  it('does NOT have hardcoded alt="Moroccan atelier"', () => {
    expect(file).not.toContain('alt="Moroccan atelier"');
  });
});

// Task 16 — ModernInstallPrompt app icon alt
describe('Task 16 — ModernInstallPrompt uses t() for app icon alt text', () => {
  const file = read('src/components/pwa/ModernInstallPrompt.tsx');

  it("uses t('pwa.app_icon_alt'", () => {
    expect(file).toContain("t('pwa.app_icon_alt'");
  });

  it('does NOT have hardcoded alt="App Icon"', () => {
    expect(file).not.toContain('alt="App Icon"');
  });
});

// Task 17 — AddressBook placeholders
describe('Task 17 — AddressBook uses t() for address field placeholders', () => {
  const file = read('src/app/profile/components/AddressBook.tsx');

  it("uses t('checkout.address.apartment_placeholder'", () => {
    expect(file).toContain("t('checkout.address.apartment_placeholder'");
  });

  it("uses t('checkout.address.city_placeholder'", () => {
    expect(file).toContain("t('checkout.address.city_placeholder'");
  });

  it('does NOT have hardcoded placeholder="Apt 4B"', () => {
    expect(file).not.toContain('placeholder="Apt 4B"');
  });

  it('does NOT have hardcoded placeholder="Casablanca"', () => {
    expect(file).not.toContain('placeholder="Casablanca"');
  });
});

// Task 18 — GeneralSettings country options
describe('Task 18 — GeneralSettings uses t() for country option labels', () => {
  const file = read('src/app/profile/components/GeneralSettings.tsx');

  it("uses t('countries.ma'", () => {
    expect(file).toContain("t('countries.ma'");
  });

  it("uses t('countries.sa'", () => {
    expect(file).toContain("t('countries.sa'");
  });

  it("uses t('countries.ae'", () => {
    expect(file).toContain("t('countries.ae'");
  });

  it("uses t('countries.qa'", () => {
    expect(file).toContain("t('countries.qa'");
  });

  it("uses t('countries.kw'", () => {
    expect(file).toContain("t('countries.kw'");
  });

  it("uses t('countries.bh'", () => {
    expect(file).toContain("t('countries.bh'");
  });

  it("uses t('countries.om'", () => {
    expect(file).toContain("t('countries.om'");
  });

  it('does NOT have hardcoded "Morocco" option label', () => {
    expect(file).not.toContain('>Morocco<');
  });

  it('does NOT have hardcoded "Saudi Arabia" option label', () => {
    expect(file).not.toContain('>Saudi Arabia<');
  });
});

// Task 19 — seller/page.tsx onboarding banner strings
describe('Task 19 — seller/page.tsx OnboardingBanner uses t() for all strings', () => {
  const file = read('src/app/seller/page.tsx');

  it("uses t('seller.onboarding_banner.active'", () => {
    expect(file).toContain("t('seller.onboarding_banner.active'");
  });

  it("uses t('seller.onboarding_banner.view_journey'", () => {
    expect(file).toContain("t('seller.onboarding_banner.view_journey'");
  });

  it("uses t('seller.onboarding_banner.pending'", () => {
    expect(file).toContain("t('seller.onboarding_banner.pending'");
  });

  it("uses t('seller.onboarding_banner.progress'", () => {
    expect(file).toContain("t('seller.onboarding_banner.progress'");
  });

  it("uses t('seller.onboarding_banner.finish_hint'", () => {
    expect(file).toContain("t('seller.onboarding_banner.finish_hint'");
  });

  it('does NOT have a bare JSX text node "Store active and live" (must be inside t())', () => {
    // Only allowed form: t('seller.onboarding_banner.active', 'Store active and live')
    expect(file).not.toMatch(/>\s*Store active and live\s*</);
    expect(file).toContain("t('seller.onboarding_banner.active'");
  });

  it('does NOT have a bare JSX text node "Application under review" (must be inside t())', () => {
    expect(file).not.toMatch(/>\s*Application under review\s*</);
    expect(file).toContain("t('seller.onboarding_banner.pending'");
  });

  it('does NOT have hardcoded "Finish your profile" as bare JSX (must be inside t())', () => {
    expect(file).not.toMatch(/>\s*Finish your profile to unlock/);
    expect(file).toContain("t('seller.onboarding_banner.finish_hint'");
  });
});

// Task 20 — seller/earnings/page.tsx EarningsChart strings
describe('Task 20 — seller/earnings/page.tsx EarningsChart uses t() for strings', () => {
  const file = read('src/app/seller/earnings/page.tsx');

  it("uses t('seller.earnings.no_daily_data'", () => {
    expect(file).toContain("t('seller.earnings.no_daily_data'");
  });

  it("uses t('seller.earnings.chart_aria'", () => {
    expect(file).toContain("t('seller.earnings.chart_aria'");
  });

  it('does NOT have a bare JSX text node "No daily data available" (must be inside t())', () => {
    // Allowed: t('seller.earnings.no_daily_data', 'No daily data available')
    expect(file).not.toMatch(/>\s*No daily data available\s*</);
    expect(file).toContain("t('seller.earnings.no_daily_data'");
  });

  it('does NOT have hardcoded aria-label "Earnings chart by day"', () => {
    expect(file).not.toContain('aria-label="Earnings chart by day"');
  });
});

// Task 21 — ClientProvider error boundary uses i18nInstance (not hook)
describe('Task 21 — ClientProvider error boundary uses i18nInstance.t() for fallback strings', () => {
  const file = read('src/providers/ClientProvider.tsx');

  it("imports i18nInstance from '@/i18n/config'", () => {
    expect(file).toMatch(/import\s+i18nInstance\s+from\s+['"]@\/i18n\/config['"]/);
  });

  it("calls i18nInstance.t('errors.boundary.oops'", () => {
    expect(file).toContain("i18nInstance.t('errors.boundary.oops'");
  });

  it("calls i18nInstance.t('errors.boundary.title'", () => {
    expect(file).toContain("i18nInstance.t('errors.boundary.title'");
  });

  it("calls i18nInstance.t('errors.boundary.body'", () => {
    expect(file).toContain("i18nInstance.t('errors.boundary.body'");
  });

  it("calls i18nInstance.t('errors.boundary.refresh'", () => {
    expect(file).toContain("i18nInstance.t('errors.boundary.refresh'");
  });

  it("calls i18nInstance.t('errors.boundary.home'", () => {
    expect(file).toContain("i18nInstance.t('errors.boundary.home'");
  });

  it('does NOT have hardcoded "Oops!" text in JSX (must come from i18nInstance)', () => {
    // The string literal >Oops!< must be gone from JSX
    expect(file).not.toContain('>Oops!</');
  });

  it('does NOT have hardcoded "Something went wrong" in JSX', () => {
    expect(file).not.toContain('>Something went wrong<');
  });

  it('does NOT have hardcoded "Refresh Page" in JSX', () => {
    expect(file).not.toContain('>Refresh Page<');
  });

  it('does NOT have hardcoded "Go Home" in JSX', () => {
    expect(file).not.toContain('>Go Home<');
  });
});
