/**
 * TDD RED — W2-FE-2: Bank-transfer buyer is blind until after order
 *
 * Tests that:
 * 1. checkout/page.tsx shows a pre-order disclosure when bank_transfer
 *    (or any transfer method) is selected — before the place-order button.
 * 2. The disclosure shows the exact amount to transfer.
 * 3. The disclosure contains a note that RIB/instructions appear after placing order.
 * 4. New i18n keys are present in all 7 locales.
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

// ─── i18n keys ────────────────────────────────────────────────────────────────

describe('W2-FE-2 — bank-transfer pre-order disclosure i18n keys in all 7 locales', () => {
  const REQUIRED_KEYS = [
    'checkout.payment.transfer_preorder_note',
    'checkout.payment.transfer_amount_label',
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

describe('W2-FE-2 — checkout shows transfer pre-order disclosure', () => {
  it('references transfer_preorder_note i18n key', () => {
    const src = readPage();
    expect(src).toMatch(/transfer_preorder_note/);
  });

  it('references transfer_amount_label i18n key', () => {
    const src = readPage();
    expect(src).toMatch(/transfer_amount_label/);
  });

  it('shows pre-order disclosure when a transfer method is selected (gates on selectedPayment kind)', () => {
    const src = readPage();
    // Must check for transfer kind methods before rendering the disclosure
    // i.e. references method.kind === 'transfer' or explicit method id checks
    expect(src).toMatch(/transfer.*kind|kind.*transfer|transfer_preorder|TRANSFER_METHODS/);
  });

  it('shows total amount in the pre-order disclosure (totalAmount or formatAmount)', () => {
    const src = readPage();
    // The pre-order disclosure must show the order total, using formatAmount or totalAmount
    // within the transfer disclosure context
    expect(src).toMatch(/transfer_amount_label[\s\S]{0,300}formatAmount|formatAmount[\s\S]{0,300}transfer_amount_label/);
  });
});
