// @vitest-environment jsdom
/**
 * CheckoutMobileBar — sticky bottom action bar for the checkout page (mobile only).
 *
 * Ensures the primary "place order" CTA is reachable without scrolling past
 * the contact / address / shipping-method cards on a phone. Mirrors the
 * PdpBuyBar / CartMobileBar sticky-bar pattern already used elsewhere.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { CheckoutMobileBar } from '../CheckoutMobileBar';

afterEach(() => {
  cleanup();
});

describe('CheckoutMobileBar', () => {
  it('is hidden on desktop (md:hidden) and fixed to the bottom on mobile', () => {
    const { container } = render(
      <CheckoutMobileBar
        totalLabel="150.00 MAD"
        ctaLabel="كمّل للتأكيد"
        step={1}
        formId="checkout-delivery"
        onSubmitStep2={() => {}}
        isProcessing={false}
      />
    );
    const bar = container.firstChild as HTMLElement;
    expect(bar.className).toMatch(/md:hidden/);
    expect(bar.className).toMatch(/fixed/);
    expect(bar.className).toMatch(/bottom-0/);
  });

  it('renders a submit button bound to the delivery form on step 1', () => {
    render(
      <CheckoutMobileBar
        totalLabel="150.00 MAD"
        ctaLabel="كمّل للتأكيد"
        step={1}
        formId="checkout-delivery"
        onSubmitStep2={() => {}}
        isProcessing={false}
      />
    );
    const btn = screen.getByRole('button', { name: /كمّل للتأكيد/ });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toHaveAttribute('form', 'checkout-delivery');
  });

  it('calls onSubmitStep2 when clicked on step 2', async () => {
    const onSubmitStep2 = vi.fn();
    render(
      <CheckoutMobileBar
        totalLabel="150.00 MAD"
        ctaLabel="أكّد الطلب"
        step={2}
        formId="checkout-delivery"
        onSubmitStep2={onSubmitStep2}
        isProcessing={false}
      />
    );
    const btn = screen.getByRole('button', { name: /أكّد الطلب/ });
    await userEvent.click(btn);
    expect(onSubmitStep2).toHaveBeenCalledTimes(1);
  });

  it('shows the formatted total amount', () => {
    render(
      <CheckoutMobileBar
        totalLabel="150.00 MAD"
        ctaLabel="كمّل للتأكيد"
        step={1}
        formId="checkout-delivery"
        onSubmitStep2={() => {}}
        isProcessing={false}
      />
    );
    expect(screen.getByText('150.00 MAD')).toBeInTheDocument();
  });

  it('disables the CTA while processing', () => {
    render(
      <CheckoutMobileBar
        totalLabel="150.00 MAD"
        ctaLabel="أكّد الطلب"
        step={2}
        formId="checkout-delivery"
        onSubmitStep2={() => {}}
        isProcessing={true}
      />
    );
    const btn = screen.getByRole('button', { name: /أكّد الطلب/ });
    expect(btn).toBeDisabled();
  });
});
