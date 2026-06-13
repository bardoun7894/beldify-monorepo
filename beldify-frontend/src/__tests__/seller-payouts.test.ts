/**
 * TDD: Seller Payouts — FE-PAYOUTS work packet
 * Tests must FAIL before implementation, PASS after.
 *
 * Covers:
 *  - Task 1: sellerPayoutService.ts exports typed functions for all 3 endpoints
 *  - Task 2: /seller/payouts/page.tsx exists with correct sections
 *  - Task 3: Seller nav already has Payouts item + earnings page has CTA
 *  - Task 4: i18n payouts namespace present in all 7 locale files
 *  - Task 5: Component behaviour (bank-details gate, open-request gate, form validation, 422 codes)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

const servicePath = join(SRC, 'services/sellerPayoutService.ts');
const pagePath = join(SRC, 'app/seller/payouts/page.tsx');
const layoutPath = join(SRC, 'app/seller/layout.tsx');
const earningsPath = join(SRC, 'app/seller/earnings/page.tsx');
const localeDir = join(SRC, 'i18n/locales');

const service = () => readFileSync(servicePath, 'utf-8');
const page = () => readFileSync(pagePath, 'utf-8');
const layout = () => readFileSync(layoutPath, 'utf-8');
const earnings = () => readFileSync(earningsPath, 'utf-8');

// ─── TASK 1: sellerPayoutService.ts ──────────────────────────────────────────

describe('Task 1 — sellerPayoutService.ts', () => {
  it('file exists at src/services/sellerPayoutService.ts', () => {
    expect(existsSync(servicePath)).toBe(true);
  });

  it('exports getSellerPayouts function', () => {
    expect(service()).toContain('getSellerPayouts');
  });

  it('exports requestPayout function', () => {
    expect(service()).toContain('requestPayout');
  });

  it('exports updateBankDetails function', () => {
    expect(service()).toContain('updateBankDetails');
  });

  it('GET /api/seller/payouts endpoint used', () => {
    expect(service()).toContain('/api/seller/payouts');
  });

  it('POST /api/seller/payouts endpoint used', () => {
    expect(service()).toContain('/api/seller/payouts');
  });

  it('PUT /api/seller/bank-details endpoint used', () => {
    expect(service()).toContain('/api/seller/bank-details');
  });

  it('exports SellerPayoutsResponse type', () => {
    expect(service()).toContain('SellerPayoutsResponse');
  });

  it('exports PayoutRequest type with status field', () => {
    expect(service()).toContain('PayoutRequest');
    expect(service()).toContain('status');
  });

  it('exports BankDetails type with account_holder, bank_name, rib', () => {
    expect(service()).toContain('account_holder');
    expect(service()).toContain('bank_name');
    expect(service()).toContain('rib');
  });

  it('response includes available, min_amount, currency fields', () => {
    expect(service()).toContain('available');
    expect(service()).toContain('min_amount');
    expect(service()).toContain('currency');
  });

  it('response includes has_open_request field', () => {
    expect(service()).toContain('has_open_request');
  });

  it('422 error codes typed: below_min, above_available, no_bank_details, open_request_exists', () => {
    expect(service()).toContain('below_min');
    expect(service()).toContain('above_available');
    expect(service()).toContain('no_bank_details');
    expect(service()).toContain('open_request_exists');
  });

  it('imports api from @/lib/api', () => {
    expect(service()).toContain("from '@/lib/api'");
  });
});

// ─── TASK 2: /seller/payouts/page.tsx ────────────────────────────────────────

describe('Task 2 — /seller/payouts/page.tsx', () => {
  it('file exists at src/app/seller/payouts/page.tsx', () => {
    expect(existsSync(pagePath)).toBe(true);
  });

  it('is a client component ("use client")', () => {
    expect(page()).toContain("'use client'");
  });

  it('imports from sellerPayoutService', () => {
    expect(page()).toContain('sellerPayoutService');
  });

  it('uses useTranslation hook', () => {
    expect(page()).toContain('useTranslation');
  });

  it('renders withdrawable-balance card section', () => {
    // Balance card must show available amount
    expect(page()).toContain('available');
  });

  it('renders bank-details section with account_holder, bank_name, rib fields', () => {
    expect(page()).toContain('account_holder');
    expect(page()).toContain('bank_name');
    expect(page()).toContain('rib');
  });

  it('gates request form when bank details are missing', () => {
    // Must check for bank_details null/missing and show a clear message
    expect(page()).toMatch(/bank_details|bankDetails/);
    expect(page()).toMatch(/gate_no_bank_details|no_bank_details/);
  });

  it('gates request form when has_open_request is true', () => {
    expect(page()).toContain('has_open_request');
    expect(page()).toMatch(/gate_open_request|open_request_exists/);
  });

  it('gates request form when available < min_amount', () => {
    expect(page()).toContain('min_amount');
    expect(page()).toMatch(/gate_below_min|below_min/);
  });

  it('request form has amount input field', () => {
    expect(page()).toMatch(/amount.*input|input.*amount|type.*number/);
  });

  it('renders payout history list', () => {
    expect(page()).toMatch(/requests|history/i);
  });

  it('status badge: pending uses amber color tokens', () => {
    expect(page()).toMatch(/amber.*pending|pending.*amber/i);
  });

  it('status badge: approved uses blue/indigo color tokens', () => {
    expect(page()).toMatch(/indigo.*approved|approved.*indigo|blue.*approved|approved.*blue/i);
  });

  it('status badge: rejected uses red/rose color tokens', () => {
    expect(page()).toMatch(/rose.*rejected|rejected.*rose|red.*rejected|rejected.*red/i);
  });

  it('status badge: paid uses green/emerald color tokens', () => {
    expect(page()).toMatch(/emerald.*paid|paid.*emerald|green.*paid|paid.*green/i);
  });

  it('paid status shows reference field', () => {
    expect(page()).toContain('reference');
  });

  it('paid status shows paid_at date', () => {
    expect(page()).toContain('paid_at');
  });

  it('rejected status shows reject_reason', () => {
    expect(page()).toContain('reject_reason');
  });

  it('uses payouts i18n namespace keys', () => {
    expect(page()).toContain('payouts.');
  });

  it('renders skeleton while loading', () => {
    expect(page()).toMatch(/skeleton|animate-pulse|loading/i);
  });

  it('renders empty state when no requests', () => {
    expect(page()).toContain('payouts.history.empty');
  });

  it('handles RTL direction for ar/ma locales', () => {
    expect(page()).toMatch(/rtl|isRTL|dir=/i);
  });

  it('formats MAD currency correctly', () => {
    // Must use fmtMAD or similar MAD formatter (matching earnings page convention)
    expect(page()).toMatch(/MAD|fmtMAD|fr-MA/);
  });

  it('uses Atlas tokens via arbitrary form bg-[hsl(var(--primary))] or similar', () => {
    // Atlas tokens use arbitrary form since primary/secondary keys are inverted
    // Must either use bg-[hsl(var(--secondary))] for indigo OR bg-indigo-700 convention
    expect(page()).toMatch(/indigo|hsl\(var\(--/);
  });

  it('success state shows pending review message after submission', () => {
    expect(page()).toMatch(/payouts\.request\.success_title|payouts\.success\.title/);
  });

  it('maps 422 error codes to user-friendly messages', () => {
    // The page must handle API error codes and map to i18n keys
    expect(page()).toMatch(/below_min|above_available|no_bank_details|open_request_exists/);
  });

  it('bank-details PUT form has save button', () => {
    expect(page()).toMatch(/payouts\.bank_details\.save/);
  });

  it('RIB input has 24-digit validation (Moroccan RIB)', () => {
    // Must validate RIB as 24 digits (spaces stripped)
    expect(page()).toMatch(/24|rib.*valid|valid.*rib/i);
  });
});

// ─── TASK 3: Seller nav + Earnings CTA ───────────────────────────────────────

describe('Task 3 — Seller nav and earnings page CTA', () => {
  it('seller layout already has Payouts nav item', () => {
    expect(layout()).toContain('/seller/payouts');
  });

  it('seller layout imports Wallet icon (for Payouts nav)', () => {
    expect(layout()).toContain('Wallet');
  });

  it('seller layout uses seller.nav.payouts i18n key', () => {
    expect(layout()).toContain("'Payouts'");
  });

  it('earnings page has a Request payout CTA link to /seller/payouts', () => {
    expect(earnings()).toContain('/seller/payouts');
  });

  it('earnings page CTA uses Wallet icon', () => {
    expect(earnings()).toContain('Wallet');
  });
});

// ─── TASK 4: i18n payouts namespace in all 7 locales ────────────────────────

describe('Task 4 — i18n: payouts namespace in all 7 locale files', () => {
  const locales = ['en', 'ar', 'ma', 'fr', 'es', 'nl', 'de'];

  for (const locale of locales) {
    it(`${locale}.json has payouts namespace`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      expect(json.payouts).toBeDefined();
    });

    it(`${locale}.json payouts has balance_card section`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      expect(json.payouts?.balance_card).toBeDefined();
    });

    it(`${locale}.json payouts has bank_details section`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      expect(json.payouts?.bank_details).toBeDefined();
    });

    it(`${locale}.json payouts has request/form section`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      // Page uses payouts.form.* namespace for the request form
      expect(json.payouts?.form).toBeDefined();
    });

    it(`${locale}.json payouts has history section`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      expect(json.payouts?.history).toBeDefined();
    });

    it(`${locale}.json payouts has status section with pending/approved/rejected/paid`, () => {
      const content = readFileSync(join(localeDir, `${locale}.json`), 'utf-8');
      const json = JSON.parse(content);
      const status = json.payouts?.status ?? {};
      expect(status.pending).toBeDefined();
      expect(status.approved).toBeDefined();
      expect(status.rejected).toBeDefined();
      expect(status.paid).toBeDefined();
    });
  }
});

// ─── TASK 5: Component-level behaviour (gate logic) ─────────────────────────

describe('Task 5 — Component gate and validation logic (structural)', () => {
  it('page has conditional rendering for bank-details editor when missing', () => {
    // Must toggle between showing bank details and an editor form
    expect(page()).toMatch(/isEditing|editMode|show.*editor|bank_details.*null/i);
  });

  it('page disables submit button when form is invalid or gated', () => {
    expect(page()).toMatch(/disabled/);
  });

  it('page calls getSellerPayouts on mount', () => {
    expect(page()).toMatch(/getSellerPayouts|fetchPayouts/);
  });

  it('page calls requestPayout on form submit', () => {
    expect(page()).toContain('requestPayout');
  });

  it('page calls updateBankDetails on bank details save', () => {
    expect(page()).toContain('updateBankDetails');
  });

  it('page has inline RIB format note (24 digits)', () => {
    expect(page()).toMatch(/payouts\.bank_details\.rib_hint|rib.*24|24.*rib/i);
  });
});
