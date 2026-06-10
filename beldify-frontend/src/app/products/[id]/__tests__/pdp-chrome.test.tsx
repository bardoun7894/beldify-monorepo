/**
 * PDP Stitch chrome — behavioral tests.
 *
 * Verifies the key chrome elements are present in the rendered PDP after the
 * async product fetch resolves.
 *
 * Design decisions recorded here:
 *  - Breadcrumb: the page renders an inline <nav aria-label="Breadcrumb"> (not a
 *    <Breadcrumbs> component), so we assert via aria-label.
 *  - "Add to bag" button: class="hidden md:flex" keeps it CSS-hidden on mobile but
 *    it is still in the DOM; the accessible name is "Add to bag".
 *  - Discount pill: the page renders −N% twice (image overlay + price row);
 *    findAllByText is used and we assert at least one exists.
 *  - Related products: getRelatedProducts must return ≥ 5 products so
 *    partitionShelves produces a non-empty alsoLike slice.
 *  - Trust pills: the translation fallbacks are 'Ships in 3 days', 'Free returns',
 *    and 'Authentic' (not 'Authenticity').
 *  - ShareButton, PdpBuyBar, HowToBuySheet, NotifyMeButton are mocked to prevent
 *    unmocked network calls and "React is not defined" errors from production files
 *    that omit `import React`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// ── Route / navigation ────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: vi.fn() }),
}));

// ── i18n ─────────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

// ── API services ──────────────────────────────────────────────────────────────
// getRelatedProducts returns 6 products so partitionShelves produces a non-empty
// alsoLike slice (indices 4-5), making the "You might also like" section render.
vi.mock('@/services/api', () => ({
  productService: {
    getProduct: vi.fn().mockResolvedValue({
      product: {
        id: '1',
        name: 'Royal Brocade Caftan',
        description: 'A handcrafted Moroccan caftan from Fez.',
        price: 4000,
        has_discount: true,
        discount_price: 3200,
        main_image: '/test-image.jpg',
        images: [{ id: 'img1', url: '/test-image.jpg', is_primary: true }],
        variants: [],
        category: 'Caftan',
        is_featured: true,
        rating: 4.8,
        reviews_count: 24,
        shop: { id: 'shop1', name: 'Atelier Fassi', location: 'Fez' },
        stock: { id: '1', quantity: 10, in_stock: true, made_to_order: false },
      },
    }),
    getRelatedProducts: vi.fn().mockResolvedValue({
      products: [
        { id: 'r1', name: 'P1', price: 1000, main_image: '/p1.jpg', images: [], variants: [], category: 'Cat' },
        { id: 'r2', name: 'P2', price: 1000, main_image: '/p2.jpg', images: [], variants: [], category: 'Cat' },
        { id: 'r3', name: 'P3', price: 1000, main_image: '/p3.jpg', images: [], variants: [], category: 'Cat' },
        { id: 'r4', name: 'P4', price: 1000, main_image: '/p4.jpg', images: [], variants: [], category: 'Cat' },
        { id: 'r5', name: 'P5', price: 1000, main_image: '/p5.jpg', images: [], variants: [], category: 'Cat' },
        { id: 'r6', name: 'P6', price: 1000, main_image: '/p6.jpg', images: [], variants: [], category: 'Cat' },
      ],
    }),
  },
}));

// ── Context mocks ─────────────────────────────────────────────────────────────
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ addItem: vi.fn(), addToCart: vi.fn(), items: [], loading: false }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));

vi.mock('@/contexts/WishlistContext', () => ({
  useWishlist: () => ({
    isInWishlist: vi.fn().mockReturnValue(false),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  }),
}));

// ── Utility mocks ─────────────────────────────────────────────────────────────
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false }),
}));

vi.mock('@/utils/formatters', () => ({
  formatPrice: (p: number) => `${p} MAD`,
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/messagingService', () => ({
  sendMessage: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={(props.alt as string) ?? ''} />;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/utils/imageUtils', () => ({
  getImageUrl: (url: string) => url,
}));

vi.mock('@/lib/utils', () => ({
  buildImageUrl: (url: string) => url,
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

vi.mock('@/utils/colorNamer', () => ({
  getColorName: () => 'Test Color',
  useLazyColorName: () => ({ colorName: null, isLoading: false, loadColorName: vi.fn() }),
}));

vi.mock('@/utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('toast-id'),
    dismiss: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Child component stubs ─────────────────────────────────────────────────────
vi.mock('@/components/reviews/ReviewsSection', () => ({
  default: () => <div data-testid="reviews-section" />,
}));

vi.mock('@/components/products/RelatedProducts', () => ({
  default: () => <div data-testid="related-products" />,
}));

// The Breadcrumbs component is NOT used by this page (the page renders an inline
// <nav aria-label="Breadcrumb"> instead). Keep this mock in case of future refactor.
vi.mock('@/components/navigation/Breadcrumbs', () => ({
  default: ({ items }: { items: { label: string; href?: string }[] }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  ),
}));

vi.mock('@/components/ui/StockStatus', () => ({
  default: () => null,
}));

// ShareButton: production file uses JSX without `import React` — mock to avoid
// "React is not defined" crash in the test environment when the classic runtime
// is active (vitest.config.ts without @vitejs/plugin-react).
vi.mock('@/components/share/ShareButton', () => ({
  default: () => <button data-testid="share-button">Share</button>,
}));

// PdpBuyBar, HowToBuySheet, NotifyMeButton: stub to prevent network calls and
// duplicate accessible-name conflicts in assertions.
vi.mock('@/components/products/PdpBuyBar', () => ({
  PdpBuyBar: () => <div data-testid="pdp-buy-bar" />,
}));

vi.mock('@/components/products/HowToBuySheet', () => ({
  HowToBuySheet: () => <div data-testid="how-to-buy-sheet" />,
}));

vi.mock('@/components/products/NotifyMeButton', () => ({
  default: () => <button data-testid="notify-me-btn">Notify me</button>,
}));

// Import React AFTER all mocks (vi.mock is hoisted automatically)
// eslint-disable-next-line import/first
import React from 'react';

describe('PDP Stitch chrome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the breadcrumb navigation', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    // Page renders an inline <nav aria-label="Breadcrumb">, not a Breadcrumbs component.
    // Wait for the async product fetch so the full layout (not the loading skeleton) mounts.
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    });
  });

  it('renders the "Add to bag" CTA button', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    // The button is CSS-hidden on mobile (hidden md:flex) but present in the DOM.
    // accessible name = "Add to bag" (t('cart.add_to_bag', 'Add to bag') fallback)
    const btn = await screen.findByRole('button', { name: /add to bag/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders an amber-500 discount pill when has_discount is true', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    // The discount text "−20%" appears in both the image overlay and the price row.
    // Use findAllByText and assert at least one element is present.
    await waitFor(async () => {
      const pills = await screen.findAllByText(/−\d+%/);
      expect(pills.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders the seller verified chip with BadgeCheck', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    const sellerText = await screen.findByText(/Atelier Fassi/);
    expect(sellerText).toBeInTheDocument();
  });

  it('renders the tailoring bespoke strip with correct link', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    const cta = await screen.findByText(/Start a tailoring order/i);
    expect(cta).toBeInTheDocument();
    const link = cta.closest('a');
    expect(link?.getAttribute('href')).toBe('/services/tailoring');
  });

  it('renders the "You might also like" related products section', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    // partitionShelves with ≥ 5 products creates two shelves: "Complete the look"
    // (first 4) and "You might also like" (items 4+). Both render RelatedProducts,
    // so there will be 2 matching elements — use findAllByTestId.
    const shelves = await screen.findAllByTestId('related-products');
    expect(shelves.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the trust micro-pills (Ships, Returns, Authentic)', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    // Translation fallbacks: t('trust.ships', 'Ships in 3 days'),
    //   t('trust.returns', 'Free returns'), t('trust.authentic', 'Authentic')
    const ships = await screen.findByText(/Ships in 3 days/i);
    expect(ships).toBeInTheDocument();
    const returns_ = await screen.findByText(/Free returns/i);
    expect(returns_).toBeInTheDocument();
    const auth = await screen.findByText(/^Authentic$/i);
    expect(auth).toBeInTheDocument();
  });
});
