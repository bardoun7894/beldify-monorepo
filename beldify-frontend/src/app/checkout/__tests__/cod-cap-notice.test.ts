/**
 * TDD RED — W2-FE-1: COD cap silent switch → make it visible
 *
 * Tests that:
 * 1. The checkout page shows a non-blocking informational notice when
 *    the total exceeds COD_MAX_AMOUNT (500 MAD).
 * 2. New i18n keys are present in all 7 locales.
 * 3. A toast is fired (toast.info or toast.warning) when the auto-switch
 *    from COD → bank_transfer happens.
 *
 * Written BEFORE implementation — must FAIL first.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PAGE_PATH = path.resolve(__dirname, '../../checkout/page.tsx');
const LOCALE_DIR = path.resolve(__dirname, '../../../../src/i18n/locales');

function readPage(): string {
  return fs.readFileSync(PAGE_PATH, 'utf-8');
}

function readLocale(locale: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, `${locale}.json`), 'utf-8'));
}

function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

const ALL_LOCALES = ['en', 'ar', 'fr', 'ma', 'es', 'nl', 'de'];

// ─── i18n key existence ───────────────────────────────────────────────────────

describe('W2-FE-1 — COD cap i18n keys present in all 7 locales', () => {
  const REQUIRED_KEYS = [
    'checkout.payment.cod_cap_info',
    'checkout.payment.cod_switched_toast',
  ];

  for (const locale of ALL_LOCALES) {
    for (const key of REQUIRED_KEYS) {
      it(`${locale} has ${key}`, () => {
        const data = readLocale(locale);
        const value = getNestedValue(data, key);
        expect(value, `${locale}.${key} must be a non-empty string`).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    }
  }
});

// ─── checkout/page.tsx structural tests ──────────────────────────────────────

describe('W2-FE-1 — checkout/page.tsx renders COD cap informational notice', () => {
  it('references cod_cap_info i18n key (informational notice when total > 500 MAD)', () => {
    const src = readPage();
    expect(src).toMatch(/cod_cap_info/);
  });

  it('references cod_switched_toast i18n key (toast on auto-switch)', () => {
    const src = readPage();
    expect(src).toMatch(/cod_switched_toast/);
  });

  it('fires a toast (toast.info or toast.warning) when COD is auto-switched away', () => {
    const src = readPage();
    // Must call toast.info or toast.warning (not just toast.error) at the switch point
    expect(src).toMatch(/toast\.(info|warning)\s*\(/);
  });

  it('shows the COD cap notice only when total > COD_MAX_AMOUNT (renders conditionally)', () => {
    const src = readPage();
    // Must gate the informational notice on the total exceeding the cap
    // i.e., reference effectiveTotalForCod > COD_MAX_AMOUNT for the notice
    expect(src).toMatch(/effectiveTotalForCod\s*[>!]\s*COD_MAX_AMOUNT/);
  });
});
