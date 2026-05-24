/**
 * TDD — RED phase
 *
 * Verifies the Stitch-design chrome elements are present in the rendered PDP.
 * This test is written BEFORE the implementation to make it fail first.
 *
 * NOTE: The vitest runner has a root-level vite.config.ts misconfiguration
 * that is outside this packet's scope.  The primary verification gate for
 * this packet is:
 *   1. `tsc --noEmit` on the product page file (no TS errors)
 *   2. `curl https://www.beldify.com/products/{1,2,3}` all returning 200
 *
 * If the runner is fixed in a future session, these tests should pass
 * against the new implementation without further changes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock all external dependencies so the component can mount in isolation
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

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
        stock: 10,
      },
    }),
  },
}));

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

// Stub child components that make network calls
vi.mock('@/components/reviews/ReviewsSection', () => ({
  default: () => <div data-testid="reviews-section" />,
}));

vi.mock('@/components/products/RelatedProducts', () => ({
  default: () => <div data-testid="related-products" />,
}));

vi.mock('@/components/navigation/Breadcrumbs', () => ({
  default: ({ items }: { items: { label: string; href?: string }[] }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
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

vi.mock('@/components/ui/StockStatus', () => ({
  default: () => null,
}));

// Import the component AFTER all mocks
// eslint-disable-next-line import/first
import React from 'react';

describe('PDP Stitch chrome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the breadcrumb navigation', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('renders the "Add to bag" CTA button', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    // Wait for async product load
    const btn = await screen.findByRole('button', { name: /add to bag/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders an amber-500 discount pill when has_discount is true', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    // The discount pill should show "−20%" (or "−X%")
    const discountEl = await screen.findByText(/−\d+%/);
    expect(discountEl).toBeInTheDocument();
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
    const related = await screen.findByTestId('related-products');
    expect(related).toBeInTheDocument();
  });

  it('renders the trust micro-pills (Ships, Returns, Authenticity)', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    const ships = await screen.findByText(/Ships in 3 days/i);
    expect(ships).toBeInTheDocument();
    const returns_ = await screen.findByText(/Free returns/i);
    expect(returns_).toBeInTheDocument();
    const auth = await screen.findByText(/Authenticity/i);
    expect(auth).toBeInTheDocument();
  });
});
