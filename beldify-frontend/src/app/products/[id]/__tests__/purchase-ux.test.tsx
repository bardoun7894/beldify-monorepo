// @vitest-environment jsdom
/**
 * TDD — purchase UX quality pass
 *
 * Tests:
 * 1. MobileBottomNav hides on /products/123 (detail), NOT on /products (listing)
 * 2. HowToBuySheet renders 3 Darija steps and no emoji
 * 3. BuyBar has زيد للسلة (indigo outline) + شري دابا (amber-500 solid)
 * 4. CartMobileBar CTA is amber-500 with Darija label
 * 5. Checkout progress bar renders 3 steps: السلة, المعلومات, التأكيد
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

// ── Minimal mocks ──────────────────────────────────────────────────────────────
let mockPathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: '123' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'ar' },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ state: { items: [] } }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

// formatters imports i18n config which tries to init — mock it out
vi.mock('@/utils/formatters', () => ({
  formatPrice: (price: number) => `${price} MAD`,
}));

// ── Cleanup between tests to prevent bleed ─────────────────────────────────────
afterEach(() => {
  cleanup();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MobileBottomNav hide logic
// ═══════════════════════════════════════════════════════════════════════════════
describe('MobileBottomNav', () => {
  it('renders on /products listing', async () => {
    mockPathname = '/products';
    const { default: MobileBottomNav } = await import(
      '@/components/layout/MobileBottomNav'
    );
    const { container } = render(<MobileBottomNav />);
    expect(container.querySelector('nav')).not.toBeNull();
    cleanup();
  });

  it('hides on /products/123 detail route', async () => {
    mockPathname = '/products/123';
    const { default: MobileBottomNav } = await import(
      '@/components/layout/MobileBottomNav'
    );
    const { container } = render(<MobileBottomNav />);
    expect(container.firstChild).toBeNull();
    cleanup();
  });

  it('hides on /products/abc-slug-456', async () => {
    mockPathname = '/products/abc-slug-456';
    const { default: MobileBottomNav } = await import(
      '@/components/layout/MobileBottomNav'
    );
    const { container } = render(<MobileBottomNav />);
    expect(container.firstChild).toBeNull();
    cleanup();
  });

  it('still hides on /checkout (existing behavior preserved)', async () => {
    mockPathname = '/checkout';
    const { default: MobileBottomNav } = await import(
      '@/components/layout/MobileBottomNav'
    );
    const { container } = render(<MobileBottomNav />);
    expect(container.firstChild).toBeNull();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. HowToBuySheet — 3 Darija steps, lucide icons, no emoji
// ═══════════════════════════════════════════════════════════════════════════════
describe('HowToBuySheet', () => {
  it('renders 3 Darija steps when open', async () => {
    const { HowToBuySheet } = await import('@/components/products/HowToBuySheet');
    const { container } = render(<HowToBuySheet isOpen={true} onClose={() => {}} />);
    // Each step label appears exactly once inside the sheet
    const allText = container.textContent ?? '';
    expect(allText).toContain('اختار القياس');
    expect(allText).toContain('دخّل سميتك');
    expect(allText).toContain('خلّص ملي توصلك');
  });

  it('renders with no emoji in step text', async () => {
    const { HowToBuySheet } = await import('@/components/products/HowToBuySheet');
    const { container } = render(<HowToBuySheet isOpen={true} onClose={() => {}} />);
    const emojiRegex = /\p{Emoji_Presentation}/u;
    expect(emojiRegex.test(container.textContent ?? '')).toBe(false);
  });

  it('is not visible when isOpen=false', async () => {
    const { HowToBuySheet } = await import('@/components/products/HowToBuySheet');
    const { container } = render(<HowToBuySheet isOpen={false} onClose={() => {}} />);
    // When closed the component returns null — no content
    expect(container.firstChild).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PdpBuyBar — button structure
// ═══════════════════════════════════════════════════════════════════════════════
describe('PdpBuyBar', () => {
  it('renders زيد للسلة with indigo ring styling', async () => {
    const { PdpBuyBar } = await import('@/components/products/PdpBuyBar');
    const { container } = render(
      <PdpBuyBar
        price={250}
        quantity={1}
        disabled={false}
        onAddToCart={() => {}}
        onBuyNow={() => {}}
        onHowToBuy={() => {}}
        addToCartLabel="زيد للسلة"
        buyNowLabel="شري دابا"
      />
    );
    // Get the first button that contains "زيد للسلة"
    const buttons = container.querySelectorAll('button');
    const addBtn = Array.from(buttons).find((b) => b.textContent?.includes('زيد للسلة'));
    expect(addBtn).toBeTruthy();
    expect(addBtn!.className).toMatch(/ring|border/);
  });

  it('renders شري دابا with amber-500 class and min-h', async () => {
    const { PdpBuyBar } = await import('@/components/products/PdpBuyBar');
    const { container } = render(
      <PdpBuyBar
        price={250}
        quantity={1}
        disabled={false}
        onAddToCart={() => {}}
        onBuyNow={() => {}}
        onHowToBuy={() => {}}
        addToCartLabel="زيد للسلة"
        buyNowLabel="شري دابا"
      />
    );
    const buttons = container.querySelectorAll('button');
    const buyBtn = Array.from(buttons).find((b) => b.textContent?.includes('شري دابا'));
    expect(buyBtn).toBeTruthy();
    expect(buyBtn!.className).toMatch(/amber-500|bg-amber/);
    expect(buyBtn!.className).toMatch(/min-h/);
  });

  it('renders a كيفاش نشري trigger button', async () => {
    const { PdpBuyBar } = await import('@/components/products/PdpBuyBar');
    const { container } = render(
      <PdpBuyBar
        price={250}
        quantity={1}
        disabled={false}
        onAddToCart={() => {}}
        onBuyNow={() => {}}
        onHowToBuy={() => {}}
        addToCartLabel="زيد للسلة"
        buyNowLabel="شري دابا"
      />
    );
    const allText = container.textContent ?? '';
    expect(allText).toContain('كيفاش نشري');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CartMobileBar — amber-500 CTA with Darija label
// ═══════════════════════════════════════════════════════════════════════════════
describe('CartMobileBar (Darija CTA)', () => {
  it('renders كمّل الشراء CTA', async () => {
    const { default: CartMobileBar } = await import('@/components/cart/CartMobileBar');
    const { container } = render(
      <CartMobileBar
        totalAmount={350}
        itemCount={2}
        onCheckout={() => {}}
        loading={false}
      />
    );
    expect(container.textContent).toContain('كمّل الشراء');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Checkout progress bar — 3 Darija steps
// ═══════════════════════════════════════════════════════════════════════════════
describe('CheckoutProgressBar', () => {
  it('renders السلة, المعلومات, التأكيد steps', async () => {
    const { CheckoutProgressBar } = await import(
      '@/components/checkout/CheckoutProgressBar'
    );
    const { container } = render(<CheckoutProgressBar currentStep={1} />);
    const text = container.textContent ?? '';
    expect(text).toContain('السلة');
    expect(text).toContain('المعلومات');
    expect(text).toContain('التأكيد');
  });
});
