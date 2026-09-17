/**
 * Profile & Wishlist — Impeccable Critique Fixes (TDD)
 *
 * Source-reading tests encoding the reference-grade critique applied to the
 * Profile dashboard + Wishlist screens (register: product). One concern per block.
 *
 *  - [P1] color: muted body/help text bumped off text-indigo-400 (fails WCAG AA on warm near-white)
 *  - [P1] color: wishlist add-to-cart becomes the amber accent affordance (bg-amber-500 / text-amber-950)
 *  - [P1] rtl:   preferences toggle knob transform gated per direction
 *  - [P2] drift: profile forms reuse shared @/components/ui/input + button foundation
 *  - [P2] color: ProfileHeader overlay references the amber token, not literal #f59e0b
 *  - [P2] color: wishlist struck price uses a muted indigo token (not gray-400) + rose-700 sale tag
 *  - [P2] motion: profile subtree wrapped in MotionConfig reducedMotion="user"
 *  - [P3] hierarchy: ProfileTabs shows a single active indicator (no double side-stripe + pill)
 *  - [P3] hierarchy: account-area wayfinding adds shared Breadcrumbs
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf-8');

const wishlist = read('src/app/wishlist/page.tsx');
const profilePage = read('src/app/profile/page.tsx');
const profileHeader = read('src/app/profile/components/ProfileHeader.tsx');
const profileTabs = read('src/app/profile/components/ProfileTabs.tsx');
const general = read('src/app/profile/components/GeneralSettings.tsx');
const preferences = read('src/app/profile/components/PreferencesSettings.tsx');
const security = read('src/app/profile/components/SecuritySettings.tsx');

const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

// ─── [P1] color — no muted BODY text on text-indigo-400 (fails WCAG AA) ───────
describe('[P1] color — muted body/help text clears WCAG AA', () => {
  it('wishlist has no text-indigo-400 (subtitle/count/empty-desc bumped to ink)', () => {
    expect(wishlist).not.toContain('text-indigo-400');
  });
  it('GeneralSettings help/hint text is not text-indigo-400', () => {
    expect(general).not.toContain('text-indigo-400');
  });
  it('PreferencesSettings descriptions/hints are not text-indigo-400', () => {
    expect(preferences).not.toContain('text-indigo-400');
  });
  it('SecuritySettings help text is not text-indigo-400', () => {
    expect(security).not.toContain('text-indigo-400');
  });
});

// ─── [P1] color — wishlist add-to-cart is the amber accent affordance ─────────
describe('[P1] color — wishlist add-to-cart uses amber-500 with dark text', () => {
  it('add-to-cart button is bg-amber-500 (not a near-invisible indigo-300 ghost)', () => {
    expect(wishlist).toContain('bg-amber-500');
  });
  it('add-to-cart text is amber-950 dark text (never white-on-amber)', () => {
    expect(wishlist).toContain('text-amber-950');
  });
  it('no add-to-cart icon left at the invisible text-indigo-300', () => {
    expect(wishlist).not.toContain('text-indigo-300');
  });
});

// ─── [P1] rtl — preferences toggle knob transform gated per direction ─────────
describe('[P1] rtl — toggle knob slides correctly under dir=rtl', () => {
  it('checked knob gates the transform with an rtl: counterpart', () => {
    expect(preferences).toContain('rtl:-translate-x-5');
  });
});

// ─── [P2] drift — profile forms reuse the shared foundation ───────────────────
describe('[P2] drift — forms reuse @/components/ui foundation', () => {
  it('GeneralSettings imports the shared Input', () => {
    expect(general).toContain("from '@/components/ui/input'");
  });
  it('GeneralSettings + Preferences + Security use the shared Button for submit', () => {
    expect(general).toContain("from '@/components/ui/button'");
    expect(preferences).toContain("from '@/components/ui/button'");
    expect(security).toContain("from '@/components/ui/button'");
  });
  it('GeneralSettings no longer forks a local AtlasInput component', () => {
    expect(general).not.toContain('function AtlasInput');
  });
  it('the native <select> handler contract is preserved (still a native select)', () => {
    // Radix Select has no e.target.value contract — the native onChange flow must stay.
    expect(general).toMatch(/<select/);
    expect(preferences).toMatch(/<select/);
  });
});

// ─── [P2] color — ProfileHeader overlay references the amber token ────────────
describe('[P2] color — Moroccan overlay references the token not literal hex', () => {
  it('no hardcoded #f59e0b in the overlay', () => {
    expect(profileHeader).not.toContain('#f59e0b');
  });
  it('overlay drives colour via currentColor + an amber text token', () => {
    expect(profileHeader).toContain('currentColor');
    expect(profileHeader).toContain('text-amber-500');
  });
});

// ─── [P2] color — wishlist sale price: muted indigo strike + rose-700 tag ─────
describe('[P2] color — wishlist sale styling on token + correct active value', () => {
  it('struck original price no longer uses non-token gray-400', () => {
    expect(wishlist).not.toContain('text-gray-400');
  });
  it('surfaces a rose-700 sale tag (Atlas reserves rose-700 for sale tags)', () => {
    expect(wishlist).toContain('rose-700');
  });
  it('the discount pill uses a token size, not an arbitrary text-[..] value', () => {
    expect(wishlist).not.toContain('text-[0.625rem]');
  });
  it('bold/active price resolves to the discounted sale_price (matches ProductCard convention)', () => {
    // Active price must read sale_price when on sale; original (price) is struck.
    // displayPrice convention: const activePrice = onSale ? sale_price : price.
    expect(wishlist).toMatch(/activePrice\s*=\s*onSale\s*\?\s*item\.product\.sale_price/);
    // The bold span renders that computed active price, struck span renders the original.
    expect(wishlist).toMatch(/font-bold[^>]*currency-mad[^]*?formatPrice\(activePrice\)/);
    expect(wishlist).toMatch(/line-through[^>]*currency-mad[^]*?formatPrice\(item\.product\.price\)/);
  });
});

// ─── [P2] motion — profile subtree honours reduced-motion ─────────────────────
describe('[P2] motion — framer respects the OS reduced-motion setting', () => {
  it('profile page wraps content in MotionConfig reducedMotion="user"', () => {
    expect(profilePage).toContain('MotionConfig');
    expect(profilePage).toContain('reducedMotion="user"');
  });
});

// ─── [P3] hierarchy — ProfileTabs single active indicator ─────────────────────
describe('[P3] hierarchy — exactly one active affordance on a tab', () => {
  it('keeps the animated layoutId pill, drops the redundant side-stripe', () => {
    expect(profileTabs).toContain('layoutId');
    expect(profileTabs).not.toContain('border-s-4');
  });
});

// ─── [P3] hierarchy — account-area breadcrumbs ────────────────────────────────
describe('[P3] hierarchy — shared Breadcrumbs wayfinding', () => {
  it('wishlist renders Breadcrumbs', () => {
    expect(wishlist).toContain('Breadcrumbs');
    expect(wishlist).toMatch(/from ['"]@\/components\/navigation\/Breadcrumbs['"]/);
  });
  it('profile renders Breadcrumbs', () => {
    expect(profilePage).toContain('Breadcrumbs');
    expect(profilePage).toMatch(/from ['"]@\/components\/navigation\/Breadcrumbs['"]/);
  });
});
