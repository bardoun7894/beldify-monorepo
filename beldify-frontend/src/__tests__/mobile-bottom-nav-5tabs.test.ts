import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const navFile = readFileSync(
  join(ROOT, 'src/components/layout/MobileBottomNav.tsx'),
  'utf-8'
);

describe('MobileBottomNav — 5-tab marketplace bottom bar', () => {
  // --- TAB PRESENCE ---
  it('has Home tab (الرئيسية)', () => {
    expect(navFile).toContain('الرئيسية');
  });

  it('has Categories tab (الأصناف) linking to /categories', () => {
    expect(navFile).toContain('الأصناف');
    expect(navFile).toContain('/categories');
  });

  it('has Open Souk tab (السوق المفتوح) linking to /community', () => {
    expect(navFile).toContain('السوق المفتوح');
    expect(navFile).toContain('/community');
  });

  it('has Cart tab (السلة) linking to /cart', () => {
    expect(navFile).toContain('السلة');
    expect(navFile).toContain('/cart');
  });

  it('has Account tab with حسابي label for authenticated users', () => {
    expect(navFile).toContain('حسابي');
    expect(navFile).toContain('/profile');
  });

  it('has تسجيل الدخول label for guest account slot', () => {
    expect(navFile).toContain('تسجيل الدخول');
    expect(navFile).toContain('/login');
  });

  // --- CART BADGE ---
  it('computes cart count from state.items (not cartItemCount)', () => {
    // Must NOT use the non-existent cartItemCount property
    expect(navFile).not.toContain('cartItemCount');
    // Must compute from state.items (may be aliased as cartState)
    expect(navFile).toMatch(/cartState\?\.items|state\?\.items/);
  });

  // --- ICONS from lucide-react (no heroicons, no emoji) ---
  it('imports icons from lucide-react only', () => {
    expect(navFile).toContain("from 'lucide-react'");
    expect(navFile).not.toContain('@heroicons');
  });

  // --- ACTIVE STATE with filled/colored icon ---
  it('applies indigo-700 color to active tab', () => {
    expect(navFile).toContain('indigo-700');
  });

  it('uses text-gray-500 for inactive tabs', () => {
    expect(navFile).toContain('text-gray-500');
  });

  // --- TOUCH TARGETS ---
  it('has minimum 48px tab height (min-h-[48px])', () => {
    expect(navFile).toMatch(/min-h-\[4[89]px\]|min-h-\[5[0-9]px\]|h-16/);
  });

  // --- LABELS ALWAYS VISIBLE (non-technical users) ---
  it('always renders label text (not icon-only)', () => {
    // Should have a span with the label visible (not sr-only)
    expect(navFile).toContain('<span');
    // Should NOT hide labels with sr-only on the visible label span
    expect(navFile).not.toContain('sr-only');
  });

  // --- NO GLASSMORPHISM (design review P2) ---
  it('has no glassmorphism (bg-white/XX backdrop-blur with bad contrast)', () => {
    // If backdrop-blur exists, background should be solid (not transparent bg-white/XX)
    // Acceptable: solid bg-white with border-t
    // NOT acceptable: bg-white/95 with backdrop-blur (P2 design violation)
    // We enforce solid bg-white
    expect(navFile).toContain('bg-white');
    // Should not use semi-transparent bg-white/N which triggers glassmorphism P2
    expect(navFile).not.toMatch(/bg-white\/\d+/);
  });

  // --- SAFE AREA ---
  it('has safe-area-inset-bottom padding', () => {
    expect(navFile).toContain('safe-area-inset-bottom');
  });

  // --- RTL LOGICAL UTILITIES ---
  it('uses RTL-safe logical start/end utilities (not left/right)', () => {
    expect(navFile).not.toMatch(/\bfixed\s+bottom-0\s+left-0/);
    // Should use start-0 end-0 logical props
    expect(navFile).toContain('start-0');
    expect(navFile).toContain('end-0');
  });

  // --- HIDDEN ON DESKTOP ---
  it('is hidden on desktop (md:hidden)', () => {
    expect(navFile).toContain('md:hidden');
  });

  // --- HIDE ON CHECKOUT ---
  it('hides on checkout routes', () => {
    expect(navFile).toMatch(/checkout/);
  });

  // --- I18N pattern with inline fallbacks ---
  it('uses t() with inline Arabic fallbacks', () => {
    // t('key', 'فالباك') — Arabic fallback strings
    expect(navFile).toMatch(/t\(.*,\s*'[؀-ۿ]/);
  });

  // --- EXACTLY 5 TABS ---
  it('defines exactly 5 navigation items', () => {
    // Count href entries for the 5 routes
    const routes = [
      navFile.includes("href: '/'"),
      navFile.includes("href: '/categories'"),
      navFile.includes("href: '/community'"),
      navFile.includes("href: '/cart'"),
      navFile.includes("href: '/profile'") || navFile.includes("href: '/login'"),
    ];
    expect(routes.filter(Boolean).length).toBe(5);
  });
});
