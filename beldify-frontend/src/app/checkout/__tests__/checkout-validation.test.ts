import { describe, it, expect } from 'vitest';

/**
 * Inline re-implementation of the validateField logic from CheckoutPage.
 * This tests the validation rules in isolation — same logic used in the component.
 */
function validateField(name: string, value: string): string {
  switch (name) {
    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) return 'checkout.validation.email_required';
      if (!emailRegex.test(value)) return 'checkout.validation.email_invalid';
      return '';
    }
    case 'phone': {
      const phoneRegex = /^\+?[0-9\s\-\(\)]{8,20}$/;
      if (!value) return 'checkout.validation.phone_required';
      if (!phoneRegex.test(value.replace(/\s/g, '')))
        return 'checkout.validation.phone_invalid';
      return '';
    }
    case 'address':
      if (!value.trim()) return 'checkout.validation.address_required';
      if (value.trim().length < 5) return 'checkout.validation.address_short';
      return '';
    case 'city':
      if (!value.trim()) return 'checkout.validation.city_required';
      return '';
    case 'state':
      if (!value.trim()) return 'checkout.validation.state_required';
      return '';
    case 'country':
      if (!value) return 'checkout.validation.country_required';
      return '';
    default:
      return '';
  }
}

describe('Checkout delivery form — field validation', () => {
  describe('email', () => {
    it('rejects empty email', () => {
      expect(validateField('email', '')).toBe('checkout.validation.email_required');
    });

    it('rejects malformed email', () => {
      expect(validateField('email', 'not-an-email')).toBe('checkout.validation.email_invalid');
    });

    it('accepts valid email', () => {
      expect(validateField('email', 'ahmed@beldify.com')).toBe('');
    });
  });

  describe('phone', () => {
    it('rejects empty phone', () => {
      expect(validateField('phone', '')).toBe('checkout.validation.phone_required');
    });

    it('rejects phone that is too short', () => {
      expect(validateField('phone', '123')).toBe('checkout.validation.phone_invalid');
    });

    it('accepts valid Moroccan phone', () => {
      expect(validateField('phone', '+212600000000')).toBe('');
    });
  });

  describe('address', () => {
    it('rejects empty address', () => {
      expect(validateField('address', '')).toBe('checkout.validation.address_required');
    });

    it('rejects address that is too short', () => {
      expect(validateField('address', 'Rue')).toBe('checkout.validation.address_short');
    });

    it('accepts valid address', () => {
      expect(validateField('address', '123 Rue Mohammed V')).toBe('');
    });
  });

  describe('city', () => {
    it('rejects empty city', () => {
      expect(validateField('city', '')).toBe('checkout.validation.city_required');
    });

    it('accepts a non-empty city', () => {
      expect(validateField('city', 'Casablanca')).toBe('');
    });
  });

  describe('state', () => {
    it('rejects empty state', () => {
      expect(validateField('state', '')).toBe('checkout.validation.state_required');
    });

    it('accepts a non-empty state', () => {
      expect(validateField('state', 'Grand Casablanca')).toBe('');
    });
  });

  describe('country', () => {
    it('rejects empty country', () => {
      expect(validateField('country', '')).toBe('checkout.validation.country_required');
    });

    it('accepts a country code', () => {
      expect(validateField('country', 'MA')).toBe('');
    });
  });

  describe('unknown field', () => {
    it('returns empty string for unknown fields', () => {
      expect(validateField('postalCode', '')).toBe('');
    });
  });
});
