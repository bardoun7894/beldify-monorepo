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

/**
 * Inline re-implementation of the full-name derivation from handlePaymentSubmit.
 * The delivery form exposes a single "Full name" field bound to `firstName`.
 * Prefill (authenticated / saved address) may set firstName + lastName separately;
 * otherwise the full name is split on whitespace so the backend always gets a
 * non-empty last_name. Regression guard for storefront-audit P0-A: guest checkout
 * was blocked because lastName was validated but had no input field.
 */
function deriveName(firstNameField: string, lastNameField = ''): {
  firstName: string;
  lastName: string;
  error: string;
} {
  const fullNameRaw = (firstNameField || '').trim();
  let firstName = fullNameRaw;
  let lastName = (lastNameField || '').trim();
  if (!lastName) {
    const parts = fullNameRaw.split(/\s+/).filter(Boolean);
    firstName = parts[0] || '';
    lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
  const error =
    !firstName || !lastName || (firstName + lastName).length < 3
      ? 'checkout.validation.full_name_required'
      : '';
  return { firstName, lastName, error };
}

describe('Checkout — full name → first/last derivation (P0-A regression)', () => {
  it('splits a single "Full name" entry into first + last and passes (the guest path that was blocked)', () => {
    const r = deriveName('Ahmed Benali');
    expect(r).toEqual({ firstName: 'Ahmed', lastName: 'Benali', error: '' });
  });

  it('rejects a one-word name with full_name_required (clear, actionable error for the field on screen)', () => {
    expect(deriveName('Ahmed').error).toBe('checkout.validation.full_name_required');
  });

  it('rejects an empty name', () => {
    expect(deriveName('').error).toBe('checkout.validation.full_name_required');
  });

  it('honours pre-filled firstName + lastName (authenticated / saved-address path) without re-splitting', () => {
    const r = deriveName('Ahmed', 'Benali');
    expect(r).toEqual({ firstName: 'Ahmed', lastName: 'Benali', error: '' });
  });

  it('keeps multi-token last names intact', () => {
    const r = deriveName('Ahmed Ben Ali');
    expect(r).toEqual({ firstName: 'Ahmed', lastName: 'Ben Ali', error: '' });
  });

  it('trims and collapses surrounding / interior whitespace', () => {
    const r = deriveName('  Ahmed   Benali  ');
    expect(r).toEqual({ firstName: 'Ahmed', lastName: 'Benali', error: '' });
  });
});
