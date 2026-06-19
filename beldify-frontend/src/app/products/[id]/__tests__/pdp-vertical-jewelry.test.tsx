// @vitest-environment jsdom
/**
 * PDP vertical-awareness — jewelry vs clothing
 *
 * Requirements tested:
 * 1. Jewelry product hides clothing UI (tailoring CTA / bespoke strip / clothing size letters / fabric picker)
 * 2. Jewelry product shows JewelrySpecBlock (renders jewelry spec data from spec/customization_options)
 * 3. Jewelry product's bespoke strip offers jewelry custom order (engraving, metal, stone) — not body measurements
 * 4. Clothes product still renders tailoring CTA (no regression)
 * 5. Ring sizes (numeric) rendered as ring-size chips for jewelry, not clothing letters
 * 6. isJewelryProduct detection utility works for different payload shapes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

// ── Route / navigation ────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '99' }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/products/99',
}));

// ── i18n ─────────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === 'string' ? fallback : key,
    i18n: { language: 'en' },
  }),
}));

// ── Context mocks ─────────────────────────────────────────────────────────────
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ addItem: vi.fn(), items: [], loading: false }),
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
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={(props.alt as string) ?? ''} />
  ),
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
    success: vi.fn(), error: vi.fn(),
    loading: vi.fn().mockReturnValue('toast-id'),
    dismiss: vi.fn(), debug: vi.fn(),
  },
}));

// ── Child component stubs ─────────────────────────────────────────────────────
vi.mock('@/components/reviews/ReviewsSection', () => ({
  default: () => <div data-testid="reviews-section" />,
}));
vi.mock('@/components/products/RelatedProducts', () => ({
  default: () => <div data-testid="related-products" />,
}));
vi.mock('@/components/navigation/Breadcrumbs', () => ({
  default: ({ items }: { items: { label: string }[] }) => (
    <nav data-testid="breadcrumbs">{items.map((i, n) => <span key={n}>{i.label}</span>)}</nav>
  ),
}));
vi.mock('@/components/share/ShareButton', () => ({
  default: () => <button data-testid="share-button">Share</button>,
}));
vi.mock('@/components/products/PdpBuyBar', () => ({
  PdpBuyBar: () => <div data-testid="pdp-buy-bar" />,
}));
vi.mock('@/components/products/HowToBuySheet', () => ({
  HowToBuySheet: () => <div data-testid="how-to-buy-sheet" />,
}));
vi.mock('@/components/products/NotifyMeButton', () => ({
  default: () => <button data-testid="notify-me-btn">Notify me</button>,
}));
vi.mock('@/components/buyer-ai/AiReviewSummaryCard', () => ({
  AiReviewSummaryCard: () => null,
}));
vi.mock('@/components/buyer-ai/SizeAdvisorSheet', () => ({
  SizeAdvisorSheet: () => null,
}));
vi.mock('@/services/buyerAiService', () => ({
  getReviewSummary: vi.fn().mockResolvedValue(null),
}));

// ── productService mock — use a container object so the closure always reads
// the latest value set in beforeEach. Declared as const (not let) to avoid
// temporal-dead-zone issues with the vi.mock hoisting.
const productDataContainer = { current: {} as Record<string, unknown> };

vi.mock('@/services/api', () => ({
  productService: {
    getProduct: vi.fn().mockImplementation(() =>
      Promise.resolve({ product: productDataContainer.current })
    ),
    getRelatedProducts: vi.fn().mockResolvedValue({ products: [] }),
  },
}));

// ── Helper: wait for product load by finding the "Add to bag" button ──────────
// This button only appears after the async product fetch resolves.
// Using this as a "product loaded" signal avoids fragile product-name assertions.
async function waitForProductLoad() {
  // "Add to bag" button (hidden md:flex but in DOM) appears after product loads.
  // Matches the same pattern used by pdp-chrome.test.tsx.
  await screen.findByRole('button', { name: /add to bag/i });
}

// ── Shared jewelry product fixture ────────────────────────────────────────────
const JEWELRY_PRODUCT = {
  id: '99',
  name: 'Gold Ring with Emerald',
  description: 'A beautiful 18k gold ring.',
  price: 1200,
  main_image: '/ring.jpg',
  images: [{ id: 'img1', url: '/ring.jpg', is_primary: true }],
  variants: [],
  category: 'jewelry',
  category_slug: 'jewelry',
  vertical: 'jewelry',
  rating: 4.5,
  reviews_count: 10,
  shop: { id: 'shop1', name: 'Atlas Bijoux', location: 'Fez' },
  stock: { id: '1', quantity: 5, in_stock: true, made_to_order: false },
  // Jewelry spec from backend customization_options
  customization_options: {
    material: 'gold',
    purity: '18k',
    weight_grams: 4.5,
    gemstone_type: 'emerald',
    gemstone_count: 1,
  },
};

// ── Shared clothing product fixture ───────────────────────────────────────────
const CLOTHING_PRODUCT = {
  id: '55',
  name: 'Royal Caftan',
  description: 'A handcrafted Moroccan caftan.',
  price: 4000,
  main_image: '/caftan.jpg',
  images: [{ id: 'img2', url: '/caftan.jpg', is_primary: true }],
  variants: [],
  category: 'Caftan',
  vertical: 'womenswear',
  rating: 4.8,
  reviews_count: 24,
  shop: { id: 'shop2', name: 'Atelier Fassi', location: 'Fez' },
  stock: { id: '2', quantity: 3, in_stock: true, made_to_order: false },
};

afterEach(() => {
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
// isJewelryProduct utility unit tests
// ─────────────────────────────────────────────────────────────────────────────
describe('isJewelryProduct utility', () => {
  it('returns true when vertical is "jewelry"', async () => {
    const { isJewelryProduct } = await import('../verticalDetection');
    expect(isJewelryProduct({ vertical: 'jewelry' })).toBe(true);
  });

  it('returns true when category_slug is "jewelry"', async () => {
    const { isJewelryProduct } = await import('../verticalDetection');
    expect(isJewelryProduct({ category_slug: 'jewelry' })).toBe(true);
  });

  it('returns true when category is "jewelry" (case-insensitive)', async () => {
    const { isJewelryProduct } = await import('../verticalDetection');
    expect(isJewelryProduct({ category: 'Jewelry' })).toBe(true);
    expect(isJewelryProduct({ category: 'JEWELRY' })).toBe(true);
  });

  it('returns true when customization_options contains material key', async () => {
    const { isJewelryProduct } = await import('../verticalDetection');
    expect(isJewelryProduct({ customization_options: { material: 'gold' } })).toBe(true);
  });

  it('returns false for clothing product', async () => {
    const { isJewelryProduct } = await import('../verticalDetection');
    expect(isJewelryProduct({ vertical: 'womenswear', category: 'Caftan' })).toBe(false);
  });

  it('returns false for empty product', async () => {
    const { isJewelryProduct } = await import('../verticalDetection');
    expect(isJewelryProduct({})).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PDP — jewelry product hides clothing UI
// ─────────────────────────────────────────────────────────────────────────────
describe('PDP — jewelry product hides clothing-specific UI', () => {
  beforeEach(() => {
    productDataContainer.current = { ...JEWELRY_PRODUCT };
  });

  it('does NOT render the tailoring bespoke strip CTA (Start a tailoring order) for jewelry', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    expect(screen.queryByText(/Start a tailoring order/i)).toBeNull();
  });

  it('does NOT render the "Custom size available" clothing tailoring link for jewelry', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    expect(screen.queryByText(/Custom size available/i)).toBeNull();
  });

  it('does NOT render fabric picker for jewelry products', async () => {
    // Jewelry product with fabric variants — fabric picker must still be hidden
    productDataContainer.current = {
      ...JEWELRY_PRODUCT,
      variants: [
        {
          id: 'v1', productId: '99', sku: 'ring-001', name: 'Ring Gold',
          price: 1200, quantity: 5, is_default: true,
          size: null, color: null,
          fabric: { id: 1, name: 'Silk', name_ar: 'حرير', code: 'SLK', description: 'Silk', description_ar: 'حرير' },
          attributes: {}, images: [],
        },
      ],
    };
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    // Fabric fieldset legend must not render for jewelry
    expect(screen.queryByText(/^Fabric$/i)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PDP — jewelry product shows jewelry spec block
// ─────────────────────────────────────────────────────────────────────────────
describe('PDP — jewelry product shows jewelry spec block', () => {
  beforeEach(() => {
    productDataContainer.current = { ...JEWELRY_PRODUCT };
  });

  it('renders the JewelrySpecBlock with material value from customization_options', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    // JewelryFields renders material value — use getAllByText since 'gold' may appear multiple times
    const goldEls = screen.getAllByText('gold');
    expect(goldEls.length).toBeGreaterThan(0);
  });

  it('renders the "Piece Specifications" jewelry spec header', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    // JewelryFields appears in both info pane and specs tab — use getAllByText
    const headers = screen.getAllByText(/Piece Specifications/i);
    expect(headers.length).toBeGreaterThan(0);
  });

  it('renders purity value from customization_options when present', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    // '18k' appears in JewelryFields
    const purityEls = screen.getAllByText('18k');
    expect(purityEls.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PDP — jewelry bespoke strip adapted for jewelry custom orders
// ─────────────────────────────────────────────────────────────────────────────
describe('PDP — jewelry bespoke strip uses jewelry-oriented CTA', () => {
  beforeEach(() => {
    productDataContainer.current = { ...JEWELRY_PRODUCT };
  });

  it('renders a jewelry custom order CTA (not the tailoring bespoke strip) for jewelry', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    // Tailoring-specific text must be absent for jewelry
    expect(screen.queryByText(/Start a tailoring order/i)).toBeNull();
    expect(screen.queryByText(/Want it tailored to you/i)).toBeNull();
  });

  it('renders jewelry-specific custom order section with jewelry-oriented copy', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    // Jewelry bespoke section must render (uses our i18n fallback keys)
    // The section has data-testid="jewelry-bespoke-strip"
    expect(document.querySelector('[data-testid="jewelry-bespoke-strip"]')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PDP — clothing product unchanged (no regression)
// ─────────────────────────────────────────────────────────────────────────────
describe('PDP — clothing product unchanged (regression guard)', () => {
  beforeEach(() => {
    productDataContainer.current = { ...CLOTHING_PRODUCT };
  });

  it('still renders the tailoring bespoke strip for clothing products', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    expect(screen.getByText(/Start a tailoring order/i)).toBeInTheDocument();
  });

  it('still renders the Custom size link for clothing products', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    expect(screen.getByText(/Custom size available/i)).toBeInTheDocument();
  });

  it('does NOT show jewelry spec block for clothing products', async () => {
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitForProductLoad();
    expect(screen.queryByText(/Piece Specifications/i)).toBeNull();
    expect(document.querySelector('[data-testid="jewelry-bespoke-strip"]')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PDP — ring size chips rendered numerically for jewelry size variants
// ─────────────────────────────────────────────────────────────────────────────
describe('PDP — jewelry size variants rendered as ring-size chips', () => {
  it('renders numeric ring sizes (52, 54, 56) for jewelry size variants', async () => {
    productDataContainer.current = {
      ...JEWELRY_PRODUCT,
      variants: [
        {
          id: 'v1', productId: '99', sku: 'ring-52', name: 'Ring 52',
          price: 1200, quantity: 3, is_default: true,
          size: { id: 10, name: '52', name_ar: '52', code: '52' },
          color: null, fabric: null, attributes: {}, images: [],
        },
        {
          id: 'v2', productId: '99', sku: 'ring-54', name: 'Ring 54',
          price: 1200, quantity: 2, is_default: false,
          size: { id: 11, name: '54', name_ar: '54', code: '54' },
          color: null, fabric: null, attributes: {}, images: [],
        },
        {
          id: 'v3', productId: '99', sku: 'ring-56', name: 'Ring 56',
          price: 1200, quantity: 1, is_default: false,
          size: { id: 12, name: '56', name_ar: '56', code: '56' },
          color: null, fabric: null, attributes: {}, images: [],
        },
      ],
    };
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);

    // Wait for variant selection to settle (default variant '52' is selected,
    // stock indicator shows availability)
    await waitFor(
      () => expect(screen.getByText('52')).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });

  it('renders with ring size legend label for jewelry with numeric sizes', async () => {
    productDataContainer.current = {
      ...JEWELRY_PRODUCT,
      variants: [
        {
          id: 'v1', productId: '99', sku: 'ring-52', name: 'Ring 52',
          price: 1200, quantity: 3, is_default: true,
          size: { id: 10, name: '52', name_ar: '52', code: '52' },
          color: null, fabric: null, attributes: {}, images: [],
        },
      ],
    };
    const { default: ProductDetailsPage } = await import('../page');
    render(<ProductDetailsPage />);
    await waitFor(
      () => expect(screen.getByText('52')).toBeInTheDocument(),
      { timeout: 3000 }
    );
    // For jewelry with numeric ring sizes, the size legend should say "Ring size"
    // May appear multiple times (e.g. in sizing tab info text) — use getAllByText
    const ringSizeLabels = screen.getAllByText(/Ring size/i);
    expect(ringSizeLabels.length).toBeGreaterThan(0);
  });
});
