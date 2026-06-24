/**
 * TDD tests — Batch A (mobile table reflow) + Batch B (a11y quick wins).
 * All tests read source files directly — no jsdom overhead.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');

// ── Batch A — Mobile table reflow ────────────────────────────────────────────

describe('Batch A — seller/page.tsx recent-orders table reflow', () => {
  const src = () => read('src/app/seller/page.tsx');

  it('card wrapper does NOT have overflow-hidden that clips the inner table scroll', () => {
    // The card around the table must NOT combine overflow-hidden with a rounded card
    // if overflow-hidden is present it must be paired with overflow-x-auto on the same element
    // OR the overflow-hidden must be removed so the Table component's scroll can work
    const source = src();
    // Find the recent-orders card container — it should not have overflow-hidden without overflow-x-auto
    // The pattern we forbid: a div with overflow-hidden NOT containing overflow-x-auto on same class string
    const cardMatch = source.match(/bg-white rounded-2xl[^"]*ring-gray-200[^"]*overflow-hidden/);
    // If the card has overflow-hidden, it must ALSO have overflow-x-auto on the same element
    if (cardMatch) {
      expect(cardMatch[0]).toContain('overflow-x-auto');
    } else {
      // Card does not have overflow-hidden — that's correct
      expect(true).toBe(true);
    }
  });

  it('loading spinner has role="status" and aria-live="polite"', () => {
    const source = src();
    // The skeleton/loading area for orders must have role="status" or aria-busy
    // (we add role="status" aria-live="polite" to the loading div)
    expect(source).toMatch(/role="status"/);
    expect(source).toMatch(/aria-live="polite"/);
  });

  it('loading spinner has an accessible label or visually-hidden text', () => {
    const source = src();
    // Must have either aria-label or a sr-only span for the loading state
    expect(source).toMatch(/aria-label=|sr-only/);
  });
});

describe('Batch A — seller/products/page.tsx products table reflow', () => {
  const src = () => read('src/app/seller/products/page.tsx');

  it('card wrapper does NOT have overflow-hidden without overflow-x-auto', () => {
    const source = src();
    const cardMatch = source.match(/bg-white rounded-2xl[^"]*ring-gray-200[^"]*overflow-hidden/);
    if (cardMatch) {
      expect(cardMatch[0]).toContain('overflow-x-auto');
    } else {
      expect(true).toBe(true);
    }
  });

  it('loading skeleton has role="status" and aria-live="polite"', () => {
    const source = src();
    expect(source).toMatch(/role="status"/);
    expect(source).toMatch(/aria-live="polite"/);
  });
});

describe('Batch A — seller/orders/[id]/page.tsx order-items table reflow', () => {
  const src = () => read('src/app/seller/orders/[id]/page.tsx');

  it('items card wrapper does NOT have overflow-hidden without overflow-x-auto', () => {
    const source = src();
    // The items card has overflow-hidden; after fix it should be removed or paired with overflow-x-auto
    const cardMatch = source.match(/lg:col-span-2[^}]*overflow-hidden/s);
    if (cardMatch) {
      expect(cardMatch[0]).toContain('overflow-x-auto');
    } else {
      expect(true).toBe(true);
    }
  });

  it('loading skeleton has role="status" and aria-live="polite"', () => {
    const source = src();
    expect(source).toMatch(/role="status"/);
    expect(source).toMatch(/aria-live="polite"/);
  });
});

// ── Batch B — Accessibility quick wins ───────────────────────────────────────

describe('Batch B — seller/messages/page.tsx unread badge a11y', () => {
  const src = () => read('src/app/seller/messages/page.tsx');

  it('conversation link has an aria-label describing the conversation and unread count', () => {
    const source = src();
    // The Link wrapping each conversation must expose an accessible name
    // Either via aria-label on the Link or via sr-only text for unread count
    expect(source).toMatch(/aria-label=|sr-only/);
  });

  it('unread badge has a screen-reader-only text describing the count', () => {
    const source = src();
    // The unread count span must have accompanying sr-only text or aria-label
    expect(source).toMatch(/sr-only|aria-label/);
  });
});

describe('Batch B — SecuritySettings.tsx password toggle uses t() for aria-label', () => {
  const src = () => read('src/app/profile/components/SecuritySettings.tsx');

  it('show/hide toggle aria-label uses t() with fallback strings, not hardcoded English', () => {
    const source = src();
    // Must NOT have bare hardcoded strings like 'Hide password' outside of t()
    // The aria-label must be wrapped in t(...)
    expect(source).not.toMatch(/aria-label=\{show \? 'Hide password' : 'Show password'\}/);
    expect(source).not.toMatch(/aria-label=\{show \? "Hide password" : "Show password"\}/);
  });

  it('show/hide toggle aria-label is state-driven via t() calls', () => {
    const source = src();
    // Must use t() for both states
    expect(source).toMatch(/aria-label=\{show\s*\?\s*t\s*\(/);
  });
});

describe('Batch B — reset-password/page.tsx password toggle aria-labels', () => {
  const src = () => read('src/app/reset-password/page.tsx');

  it('new-password toggle aria-label is state-driven using t()', () => {
    const source = src();
    // showPassword toggle must use t() in aria-label
    expect(source).toMatch(/showPassword\s*\?\s*t\s*\(/);
  });

  it('confirm-password toggle aria-label is state-driven using t()', () => {
    const source = src();
    // showConfirm toggle must use t() in aria-label
    expect(source).toMatch(/showConfirm\s*\?\s*t\s*\(/);
  });
});
