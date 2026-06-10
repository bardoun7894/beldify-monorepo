/**
 * TDD — unit tests for the seller unread badge helpers in src/app/seller/layout.tsx
 *
 * These tests stay in node environment (no DOM) to test the pure logic:
 * - formatBadge(count) function exported for testability
 *
 * Integration (badge renders in nav) is covered by the lint + manual smoke test
 * because testing the full SellerLayout requires mounting Next.js router context
 * which is brittle in jsdom.
 */

import { describe, it, expect } from 'vitest';

// We test the badge formatting logic directly since it is a pure function.
// The layout exports it for testability.
import { formatBadge } from '../layout';

describe('formatBadge (seller unread badge helper)', () => {
  it('returns the count as a string when count is 1', () => {
    expect(formatBadge(1)).toBe('1');
  });

  it('returns the count as a string when count is 99', () => {
    expect(formatBadge(99)).toBe('99');
  });

  it('returns "99+" when count is 100', () => {
    expect(formatBadge(100)).toBe('99+');
  });

  it('returns "99+" when count is 120', () => {
    expect(formatBadge(120)).toBe('99+');
  });

  it('returns "0" when count is 0', () => {
    expect(formatBadge(0)).toBe('0');
  });
});
