// @vitest-environment jsdom
/**
 * TDD — one-tap post-purchase account card on order-confirmation page.
 *
 * Behaviour contract:
 *  - If user is NOT authenticated AND beldify_last_order stash exists WITH phone → show card
 *  - Card has a single password input + "Create my account" button
 *  - On submit: calls register({ full_name_en, phone, password, password_confirmation, email? })
 *  - On success: shows success state, hides form
 *  - If phone is missing from stash → card is hidden
 *  - If user IS authenticated → card is hidden
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── mocks ────────────────────────────────────────────────────────────────────

const registerMock = vi.fn();
let mockIsAuthenticated = false;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => 'ORD-001' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, register: registerMock }),
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Stub heavy dependencies on the confirmation page
vi.mock('@/services/orderService', () => ({
  orderService: { getOrderDetails: vi.fn().mockResolvedValue(null) },
  Order: {},
  OrderItem: {},
  PerSellerOrder: {},
}));
vi.mock('@/hooks/usePWATriggers', () => ({
  usePWATriggers: () => ({ triggerOnOrderComplete: vi.fn() }),
}));
vi.mock('@/hooks/useWebPush', () => ({
  useWebPush: () => ({ isSubscribed: false, isLoading: false, subscribe: vi.fn() }),
}));
vi.mock('@/components/pwa/PostOrderPushPrompt', () => ({
  default: () => null,
}));
vi.mock('@/components/checkout/PaymentProofUpload', () => ({
  default: () => null,
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const STASH_WITH_PHONE = {
  order_number: 'ORD-001',
  total_amount: 150,
  shipping_amount: 0,
  tax_amount: 0,
  payment_status: 'pending',
  items: [],
  shipping_info: {
    first_name: 'Amina',
    last_name: 'Tazi',
    phone: '+212612345678',
    email: 'amina@example.com',
    address: '123 Rue Atlas',
    city: 'Casablanca',
    country: 'MA',
  },
};

const STASH_WITHOUT_PHONE = {
  ...STASH_WITH_PHONE,
  shipping_info: {
    ...STASH_WITH_PHONE.shipping_info,
    phone: '',
  },
};

function seedStash(stash: object) {
  sessionStorage.setItem('beldify_last_order', JSON.stringify(stash));
}

// Import AFTER mocks
import OneTapAccountCard from '../OneTapAccountCard';

// ── tests ─────────────────────────────────────────────────────────────────────

describe('OneTapAccountCard', () => {
  beforeEach(() => {
    registerMock.mockReset();
    mockIsAuthenticated = false;
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows the card when guest has stash with phone', () => {
    seedStash(STASH_WITH_PHONE);
    render(
      <OneTapAccountCard
        isAuthenticated={false}
        lastOrderStash={STASH_WITH_PHONE as any}
      />
    );
    expect(screen.getByText(/track this order/i)).toBeTruthy();
    expect(document.getElementById('one-tap-password')).not.toBeNull();
  });

  it('hides the card when user is authenticated', () => {
    seedStash(STASH_WITH_PHONE);
    const { container } = render(
      <OneTapAccountCard
        isAuthenticated={true}
        lastOrderStash={STASH_WITH_PHONE as any}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('hides the card when stash has no phone', () => {
    seedStash(STASH_WITHOUT_PHONE);
    const { container } = render(
      <OneTapAccountCard
        isAuthenticated={false}
        lastOrderStash={STASH_WITHOUT_PHONE as any}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls register() with stash name/phone/email on submit', async () => {
    registerMock.mockResolvedValue({ success: true });
    seedStash(STASH_WITH_PHONE);

    render(
      <OneTapAccountCard
        isAuthenticated={false}
        lastOrderStash={STASH_WITH_PHONE as any}
      />
    );

    const passwordInput = document.getElementById('one-tap-password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });

    const btn = screen.getByRole('button', { name: /create my account/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name_en: 'Amina Tazi',
          phone: '+212612345678',
          password: 'Secret123!',
          password_confirmation: 'Secret123!',
          email: 'amina@example.com',
        })
      );
    });
  });

  it('shows success state after successful registration', async () => {
    registerMock.mockResolvedValue({ success: true });
    seedStash(STASH_WITH_PHONE);

    render(
      <OneTapAccountCard
        isAuthenticated={false}
        lastOrderStash={STASH_WITH_PHONE as any}
      />
    );

    const passwordInput = document.getElementById('one-tap-password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create my account/i }));

    await waitFor(() => {
      expect(screen.getByText(/account created/i)).toBeTruthy();
    });
    // Form should be hidden
    expect(document.getElementById('one-tap-password')).toBeNull();
  });

  it('shows inline error and login link when register fails (phone taken)', async () => {
    registerMock.mockRejectedValue({
      message: 'The phone has already been taken.',
      errors: { phone: ['The phone has already been taken.'] },
    });
    seedStash(STASH_WITH_PHONE);

    render(
      <OneTapAccountCard
        isAuthenticated={false}
        lastOrderStash={STASH_WITH_PHONE as any}
      />
    );

    const passwordInput = document.getElementById('one-tap-password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create my account/i }));

    await waitFor(() => {
      expect(screen.getByText(/already been taken/i)).toBeTruthy();
    });
    // Should show a link to /login
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeTruthy();
  });
});
