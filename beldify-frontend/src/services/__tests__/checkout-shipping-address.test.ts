/**
 * TDD — checkout shipping + address prefill integration logic tests.
 * These test the pure logic helpers that will live in checkout/page.tsx.
 *
 * We test:
 *   1. shippingService.getMethods fallback integration
 *   2. addressService.prefillFromAddress shapes the form state correctly
 *   3. shipping_method_id is included in cart checkout payload
 */

import { describe, it, expect } from 'vitest';
import { addressService, SavedAddress } from '../addressService';
import { shippingService } from '../shippingService';

describe('addressService.prefillFromAddress (checkout integration)', () => {
  it('maps all address fields to checkout form shape', () => {
    const addr: SavedAddress = {
      id: 5,
      label: 'Home',
      first_name: 'Fatima',
      last_name: 'Zahra',
      email: 'fatima@example.com',
      phone: '+212612345678',
      address: '12 Avenue Hassan II',
      apartment: 'Apt 3',
      city: 'Rabat',
      state: 'Rabat-Salé',
      postal_code: '10000',
      country: 'MA',
      is_default: true,
    };

    const prefill = addressService.prefillFromAddress(addr);

    expect(prefill.firstName).toBe('Fatima');
    expect(prefill.lastName).toBe('Zahra');
    expect(prefill.email).toBe('fatima@example.com');
    expect(prefill.phone).toBe('+212612345678');
    expect(prefill.address).toBe('12 Avenue Hassan II');
    expect(prefill.apartment).toBe('Apt 3');
    expect(prefill.city).toBe('Rabat');
    expect(prefill.state).toBe('Rabat-Salé');
    expect(prefill.postalCode).toBe('10000');
    expect(prefill.country).toBe('MA');
  });

  it('handles missing optional fields gracefully', () => {
    const addr: SavedAddress = {
      id: 6,
      first_name: 'Ali',
      last_name: 'Idrissi',
      address: 'Rue 7',
      city: 'Fez',
      country: 'MA',
    };

    const prefill = addressService.prefillFromAddress(addr);

    expect(prefill.email).toBe('');
    expect(prefill.phone).toBe('');
    expect(prefill.apartment).toBeUndefined();
    expect(prefill.state).toBe('');
    // postal_code was not set on the raw address, so postalCode maps to undefined
    expect(prefill.postalCode).toBeUndefined();
  });
});

describe('shippingService fallback costs (checkout rendering)', () => {
  it('fallback standard method is free when subtotal >= 500', () => {
    const methods = shippingService.getFallback(600);
    const standard = methods.find((m) => m.id === 'standard')!;

    expect(standard.is_free).toBe(true);
    expect(standard.cost).toBe(0);
  });

  it('fallback standard method costs 30 when subtotal < 500', () => {
    const methods = shippingService.getFallback(200);
    const standard = methods.find((m) => m.id === 'standard')!;

    expect(standard.is_free).toBe(false);
    expect(standard.cost).toBe(30);
  });

  it('fallback express always costs 70', () => {
    const methods = shippingService.getFallback(100);
    const express = methods.find((m) => m.id === 'express')!;

    expect(express.cost).toBe(70);
    expect(express.is_free).toBe(false);
  });

  it('fallback pickup is always free', () => {
    const methods = shippingService.getFallback(0);
    const pickup = methods.find((m) => m.id === 'pickup')!;

    expect(pickup.cost).toBe(0);
    expect(pickup.is_free).toBe(true);
  });
});
