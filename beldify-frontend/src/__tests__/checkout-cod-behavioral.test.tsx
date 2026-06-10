// @vitest-environment jsdom
/**
 * Checkout COD — behavioral (render) tests
 *
 * Proves: COD selected → card not required → createOrder called with
 * payment_method:'cash_on_delivery' → router redirected to /order-confirmation
 *
 * Strategy: render CheckoutPage with a prefilled cart (one item), mock
 * orderService.createOrder, mock cartService.checkStock, advance to step 2
 * (payment), then click "Place order" and assert on the mock calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Module mocks — must be declared before any imports of the mocked modules ──
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/checkout',
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [k: string]: any }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _fallback?: string) => {
      // Return English strings for checkout action keys so tests can use
      // getByRole('button', { name: /.../ }) with English regex.
      const overrides: Record<string, string> = {
        'checkout.actions.continue_to_confirm': 'Continue to confirmation',
        'checkout.actions.confirm_order': 'Place order',
        'checkout.actions.processing': 'Processing...',
      };
      return overrides[key] ?? _fallback ?? key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../utils/consoleLogger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../utils/imageUtils', () => ({
  getImageUrl: (url: string, fallback: string) => url || fallback,
}));

vi.mock('../hooks/usePWATriggers', () => ({
  usePWATriggers: () => ({
    triggerOnCheckout: vi.fn(),
    triggerOnOrderComplete: vi.fn(),
  }),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock CartContext — provide a cart with one item so the page renders the checkout form
vi.mock('../contexts/CartContext', () => ({
  useCart: vi.fn(),
}));

// Mock orderService — use vi.fn() inside factory to avoid hoisting issues
vi.mock('../services/orderService', () => ({
  orderService: {
    createOrder: vi.fn(),
  },
}));

// Mock cartService.checkStock to always say "in stock"
vi.mock('../services/api', () => ({
  cartService: {
    checkStock: vi.fn().mockResolvedValue({
      status: 'in_stock',
      available_quantity: 100,
    }),
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { orderService } from '../services/orderService';
import CheckoutPage from '../app/checkout/page';

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockUseCart = useCart as unknown as ReturnType<typeof vi.fn>;
const mockCreateOrder = orderService.createOrder as ReturnType<typeof vi.fn>;

// ── Shared test cart state ─────────────────────────────────────────────────────
const mockCartItem = {
  id: 1,
  stock_id: 10,
  variant_id: null,
  quantity: 1,
  unit_price: 250,
  product: {
    id: 42,
    name: 'Test Djellaba',
    name_ar: 'جلابة اختبار',
    image_url: '/test.jpg',
  },
  store: { id: 5 },
};

const mockCartState = {
  items: [mockCartItem],
  subtotal: 250,
  tax_amount: 0,
  shipping_amount: 0,
  discount_amount: 0,
  total_amount: 250,
  coupon_code: null,
};

const mockAuthUser = {
  id: 7,
  email: 'buyer@example.com',
  first_name: 'Ahmed',
  last_name: 'Benali',
  contact_number: '+212600000000',
  address_en: '12 Rue des Fleurs',
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Checkout COD — behavioral tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthUser,
      loading: false,
    });

    mockUseCart.mockReturnValue({
      state: mockCartState,
      clearCart: vi.fn().mockResolvedValue(undefined),
    });

    mockCreateOrder.mockResolvedValue({
      status: 'success',
      success: true,
      data: {
        order_number: 'ORD-001',
        id: 99,
      },
    });
  });

  it('renders the payment section with COD as the default (step 2)', async () => {
    render(<CheckoutPage />);

    // The shipping form is on step 1. Fill required fields and advance.
    // Auth prefill sets firstName, lastName, email, phone, address.
    // We need to fill city, state, country (country defaults to MA from initialState).

    const cityInput = screen.getByLabelText(/city/i);
    fireEvent.change(cityInput, { target: { name: 'city', value: 'Casablanca' } });

    const stateInput = screen.getByLabelText(/region/i);
    fireEvent.change(stateInput, { target: { name: 'state', value: 'Grand Casablanca' } });

    // Continue to payment step via the summary CTA button (type=submit on the form)
    const continueBtn = screen.getByRole('button', { name: /continue to confirmation/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      // On step 2, the payment method section should be visible
      expect(screen.queryByText('Payment method')).not.toBeNull();
    });
  });

  it('COD is pre-selected by default (no card form required)', async () => {
    render(<CheckoutPage />);

    // Advance to step 2
    const cityInput = screen.getByLabelText(/city/i);
    fireEvent.change(cityInput, { target: { name: 'city', value: 'Casablanca' } });
    const stateInput = screen.getByLabelText(/region/i);
    fireEvent.change(stateInput, { target: { name: 'state', value: 'Grand Casablanca' } });
    fireEvent.click(screen.getByRole('button', { name: /continue to confirmation/i }));

    await waitFor(() => {
      expect(screen.queryByText('Payment method')).not.toBeNull();
    });

    // No required card inputs should be present
    const cardNumberInput = screen.queryByDisplayValue('');
    // More specifically: no input with name="cardNumber" should be in the DOM
    const allInputs = screen.queryAllByRole('textbox');
    const cardInputs = allInputs.filter((el) =>
      el.getAttribute('name') === 'cardNumber' ||
      el.getAttribute('name') === 'cvv'
    );
    expect(cardInputs).toHaveLength(0);
  });

  it('calls createOrder with payment_method:cash_on_delivery when COD is selected and order is placed', async () => {
    render(<CheckoutPage />);

    // Fill city and state (auth prefills name/email/phone/address)
    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { name: 'city', value: 'Casablanca' },
    });
    fireEvent.change(screen.getByLabelText(/region/i), {
      target: { name: 'state', value: 'Grand Casablanca' },
    });

    // Advance to step 2
    fireEvent.click(screen.getByRole('button', { name: /continue to confirmation/i }));

    await waitFor(() => {
      expect(screen.queryByText('Payment method')).not.toBeNull();
    });

    // Place order (COD is already selected as default)
    const placeOrderBtns = screen.queryAllByRole('button', { name: /place order/i });
    expect(placeOrderBtns.length).toBeGreaterThan(0);
    fireEvent.click(placeOrderBtns[0]);

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    });

    const callArg = mockCreateOrder.mock.calls[0][0];
    expect(callArg.payment_method).toBe('cash_on_delivery');
  });

  it('redirects to /order-confirmation with orderId after successful COD order', async () => {
    render(<CheckoutPage />);

    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { name: 'city', value: 'Casablanca' },
    });
    fireEvent.change(screen.getByLabelText(/region/i), {
      target: { name: 'state', value: 'Grand Casablanca' },
    });

    fireEvent.click(screen.getByRole('button', { name: /continue to confirmation/i }));

    await waitFor(() => {
      expect(screen.queryByText('Payment method')).not.toBeNull();
    });

    const placeOrderBtns = screen.queryAllByRole('button', { name: /place order/i });
    fireEvent.click(placeOrderBtns[0]);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining('/order-confirmation?orderId=ORD-001')
      );
    });
  });
});
