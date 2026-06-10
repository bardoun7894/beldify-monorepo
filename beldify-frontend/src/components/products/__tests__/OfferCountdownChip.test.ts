/**
 * TDD RED — OfferCountdownChip unit tests
 *
 * Written BEFORE implementation. Must fail first.
 *
 * Proves:
 * 1. OfferCountdownChip file exists at src/components/products/OfferCountdownChip.tsx
 * 2. formatCountdown helper correctly computes "Ends in Xh Ym" from a future timestamp.
 * 3. isOfferActive returns false when ends_at is null/undefined/past.
 * 4. isOfferActive returns true when ends_at is a future ISO timestamp.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const CHIP_PATH = path.resolve(
  __dirname,
  '../OfferCountdownChip.tsx'
);

describe('OfferCountdownChip — static + logic checks', () => {
  it('OfferCountdownChip.tsx exists at src/components/products/OfferCountdownChip.tsx', () => {
    expect(fs.existsSync(CHIP_PATH)).toBe(true);
  });

  it('exports a default React component', async () => {
    const mod = await import('../OfferCountdownChip');
    expect(typeof mod.default).toBe('function');
  });

  it('exports isOfferActive helper', async () => {
    const mod = await import('../OfferCountdownChip');
    expect(typeof mod.isOfferActive).toBe('function');
  });

  it('isOfferActive returns false for null ends_at', async () => {
    const { isOfferActive } = await import('../OfferCountdownChip');
    expect(isOfferActive(null)).toBe(false);
  });

  it('isOfferActive returns false for undefined ends_at', async () => {
    const { isOfferActive } = await import('../OfferCountdownChip');
    expect(isOfferActive(undefined)).toBe(false);
  });

  it('isOfferActive returns false for a past ISO timestamp', async () => {
    const { isOfferActive } = await import('../OfferCountdownChip');
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isOfferActive(past)).toBe(false);
  });

  it('isOfferActive returns true for a future ISO timestamp', async () => {
    const { isOfferActive } = await import('../OfferCountdownChip');
    const future = new Date(Date.now() + 3_600_000).toISOString();
    expect(isOfferActive(future)).toBe(true);
  });

  it('exports formatCountdown helper', async () => {
    const mod = await import('../OfferCountdownChip');
    expect(typeof mod.formatCountdown).toBe('function');
  });

  it('formatCountdown returns "Ends in Xh Ym" for a timestamp ~2h 5m away', async () => {
    const { formatCountdown } = await import('../OfferCountdownChip');
    const twoHoursFiveMin = new Date(Date.now() + (2 * 60 + 5) * 60_000).toISOString();
    const result = formatCountdown(twoHoursFiveMin);
    // Should contain hour and minute counts
    expect(result).toMatch(/2h/);
    expect(result).toMatch(/\dm/);
  });

  it('formatCountdown returns "Ends in Xm" (no hours) when < 1h away', async () => {
    const { formatCountdown } = await import('../OfferCountdownChip');
    const thirtyMin = new Date(Date.now() + 30 * 60_000).toISOString();
    const result = formatCountdown(thirtyMin);
    expect(result).toMatch(/30m/);
    // No "h" for under 1 hour
    expect(result).not.toMatch(/\dh/);
  });
});
