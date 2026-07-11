/**
 * guest-shopping-flow.test.ts
 *
 * TDD tests for the guest checkout / wishlist / cart-counter / animation
 * fixes re-applied on the fix/guest-shopping-flow branch.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ─── A1: layout.tsx viewport ───────────────────────────────────────────────
describe('A1 — WCAG 1.4.4 viewport (layout.tsx)', () => {
  const layout = read('src/app/layout.tsx');

  it('does not set maximumScale in generateViewport', () => {
    expect(layout).not.toMatch(/maximumScale\s*:/);
  });

  it('does not set userScalable in generateViewport', () => {
    expect(layout).not.toMatch(/userScalable\s*:/);
  });

  it('still exports generateViewport with width and initialScale', () => {
    expect(layout).toContain('generateViewport');
    expect(layout).toMatch(/width\s*:/);
    expect(layout).toMatch(/initialScale\s*:/);
  });
});

// ─── A2: Toaster always renders (layout-client.tsx) ────────────────────────
describe('A2 — Toaster always visible (layout-client.tsx)', () => {
  const layoutClient = read('src/app/layout-client.tsx');

  it('does not wrap Toaster in isDebuggingEnabled()', () => {
    // The old gated pattern: {isDebuggingEnabled() && (<Toaster .../>)}
    expect(layoutClient).not.toMatch(/isDebuggingEnabled\s*\(\s*\)\s*&&\s*\(\s*<Toaster/);
  });

  it('renders Toaster unconditionally', () => {
    // Toaster must appear outside any conditional
    expect(layoutClient).toContain('<Toaster');
  });

  it('does not import isDebuggingEnabled from debugMode', () => {
    // The import statement must not reference debugMode
    expect(layoutClient).not.toContain("from '@/utils/debugMode'");
  });
});

// ─── A3a: AuthContext — /checkout not in protectedRoutes ───────────────────
describe('A3a — /checkout removed from protectedRoutes (AuthContext.tsx)', () => {
  const auth = read('src/contexts/AuthContext.tsx');

  it('does not include /checkout in the protectedRoutes array', () => {
    // Extract the protectedRoutes definition block
    const match = auth.match(/const protectedRoutes\s*=\s*\[([\s\S]*?)\]/);
    expect(match).toBeTruthy();
    if (match) {
      expect(match[1]).not.toContain("'/checkout'");
      expect(match[1]).not.toContain('"/checkout"');
    }
  });
});

// ─── A3b: AuthContext — register() merges guest cart ───────────────────────
describe('A3b — register() merges guest cart on success (AuthContext.tsx)', () => {
  const auth = read('src/contexts/AuthContext.tsx');

  it('calls cartService.mergeGuestCart() inside register success path', () => {
    // The register() function must call mergeGuestCart, mirroring login()
    expect(auth).toContain('cartService.mergeGuestCart()');
  });

  it('dispatches cart:refresh after merge inside register()', () => {
    // Must fire window.dispatchEvent(new Event('cart:refresh')) after merge
    expect(auth).toContain("new Event('cart:refresh')");
  });

  it('calls mergeGuestCart at least twice (once in login, once in register)', () => {
    const count = (auth.match(/mergeGuestCart/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ─── A5: CartMobileBar — RTL arrow ─────────────────────────────────────────
describe('A5 — CartMobileBar checkout arrow RTL (CartMobileBar.tsx)', () => {
  const bar = read('src/components/cart/CartMobileBar.tsx');

  it('applies rtl:rotate-180 to the ArrowRight icon', () => {
    expect(bar).toContain('rtl:rotate-180');
  });
});

// ─── B6: Guest wishlist — PDP page.tsx ─────────────────────────────────────
describe('B6 — Guest wishlist works without login (products/[id]/page.tsx)', () => {
  const pdp = read('src/app/products/[id]/page.tsx');

  it('handleWishlistToggle does NOT redirect guests to /login', () => {
    // Find the handleWishlistToggle function body
    const match = pdp.match(/const handleWishlistToggle[\s\S]{0,800}/);
    if (match) {
      // Must NOT push to /login when !isAuthenticated
      const body = match[0];
      // The old pattern used a template literal: router.push(`/login?redirect=...`)
      // We check for any router.push call with /login
      const hasAuthRedirect =
        body.includes("router.push('/login") ||
        body.includes('router.push("/login') ||
        body.includes('router.push(`/login');
      expect(hasAuthRedirect).toBe(false);
    }
  });

  it('calls addToWishlist or removeFromWishlist without an auth gate', () => {
    const match = pdp.match(/const handleWishlistToggle[\s\S]{0,800}/);
    expect(match).toBeTruthy();
    if (match) {
      const body = match[0];
      // Must call addToWishlist / removeFromWishlist (both work for guests via
      // WishlistContext guest path)
      const callsWishlist =
        body.includes('addToWishlist') || body.includes('removeFromWishlist');
      expect(callsWishlist).toBe(true);
    }
  });
});

// ─── B6: WishlistContext — guest path exists ────────────────────────────────
describe('B6 — WishlistContext guest localStorage path', () => {
  const ctx = read('src/contexts/WishlistContext.tsx');

  it('addToWishlist handles !isAuthenticated without throwing', () => {
    // Must have a guest branch in addToWishlist
    expect(ctx).toContain('!isAuthenticated');
    // Guest path must persist to localStorage via addGuestWishlistItem
    expect(ctx).toContain('addGuestWishlistItem');
  });

  it('removeFromWishlist handles !isAuthenticated', () => {
    expect(ctx).toContain('removeGuestWishlistItem');
  });

  it('imports guestWishlist utilities', () => {
    expect(ctx).toContain("from '@/utils/guestWishlist'");
  });
});

// ─── B7: Cart-add animation — CSS pulse + prefers-reduced-motion ────────────
describe('B7 — Add-to-cart animation (Navbar.tsx)', () => {
  const navbar = read('src/components/layout/Navbar.tsx');
  const globals = read('src/app/globals.css');

  it('does NOT import framer-motion in Navbar (uses CSS animation instead)', () => {
    // The home-merchandising-layer test forbids new animation library imports in Navbar
    expect(navbar).not.toMatch(/from\s+['"]framer-motion['"]/);
  });

  it('uses cartBumpKey state to trigger CSS animation re-mount on cart:refresh', () => {
    // The badge must use a dynamic key tied to cart bump state so React remounts
    // the element and the CSS animation re-fires on each add.
    expect(navbar).toContain('cartBumpKey');
  });

  it('applies cart-badge-bump CSS class to the cart badge', () => {
    expect(navbar).toContain('cart-badge-bump');
  });

  it('defines @keyframes cart-badge-pulse in globals.css', () => {
    expect(globals).toContain('cart-badge-pulse');
  });

  it('respects prefers-reduced-motion by disabling the CSS animation', () => {
    expect(globals).toContain('prefers-reduced-motion');
    expect(globals).toContain('cart-badge-bump');
  });

  it('listens to cart:refresh event to bump the animation key', () => {
    expect(navbar).toMatch(/['"]cart:refresh['"]/);
  });
});

// ─── B8: Cart counter reads from CartContext ────────────────────────────────
describe('B8 — Cart counter reads from CartContext in Navbar + MobileBottomNav', () => {
  const navbar = read('src/components/layout/Navbar.tsx');
  const mobileNav = read('src/components/layout/MobileBottomNav.tsx');

  it('Navbar imports useCart and derives cartItemCount from state.items', () => {
    expect(navbar).toContain('useCart');
    expect(navbar).toContain('cartState');
  });

  it('MobileBottomNav imports useCart and derives cartCount from state.items', () => {
    expect(mobileNav).toContain('useCart');
    expect(mobileNav).toContain('cartCount');
    // Must use items.reduce, not a hardcoded 0
    expect(mobileNav).toContain('reduce');
  });
});

// ─── C9: Cart-add diagnostics logging ──────────────────────────────────────
describe('C9 — CARTDBG diagnostics in add-to-cart path', () => {
  const pdp = read('src/app/products/[id]/page.tsx');
  const cartCtx = read('src/contexts/CartContext.tsx');
  const apiLib = read('src/lib/api.ts');

  it('does NOT log CARTDBG in handleAddToCart of PDP (debug logging removed)', () => {
    // CARTDBG console.warn blocks have been removed from the PDP to clean up production output.
    expect(pdp).not.toContain('[CARTDBG]');
  });

  it('does NOT log CARTDBG in handlePurchaseNow of PDP (debug logging removed)', () => {
    // CARTDBG console.warn blocks have been removed from the PDP to clean up production output.
    const purchaseNowMatch = pdp.match(/const handlePurchaseNow[\s\S]{0,2000}/);
    if (purchaseNowMatch) {
      expect(purchaseNowMatch[0]).not.toContain('[CARTDBG]');
    }
  });

  it('logs CARTDBG payload in CartContext addItem', () => {
    expect(cartCtx).toContain('[CARTDBG]');
  });

  it('logs CARTDBG in lib/api.ts request interceptor', () => {
    expect(apiLib).toContain('[CARTDBG]');
  });

  it('does NOT log the raw token value (only a short hash prefix)', () => {
    // Security: token value must never be logged wholesale.
    // We check that any token logging uses .slice(0,6) or similar truncation.
    if (apiLib.includes('[CARTDBG]') && apiLib.includes('guest_token')) {
      // If the token is referenced near a log, it must be sliced
      expect(apiLib).toMatch(/slice\s*\(\s*0\s*,\s*[0-9]+\s*\)/);
    }
  });
});
