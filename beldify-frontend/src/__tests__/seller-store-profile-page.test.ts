/**
 * Seller store-profile Next.js page (TDD, source-reading)
 *
 * Previously there was no Next.js page for sellers to edit their own shop
 * profile — only a legacy Blade view existed on the backend. This adds
 * src/app/seller/store-profile/page.tsx wired to the real
 * GET/PUT /api/seller/store-profile endpoints (SellerStoreProfileController).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf-8');

const page = read('src/app/seller/store-profile/page.tsx');

describe('seller store-profile page', () => {
  it('is a client component', () => {
    expect(page).toMatch(/^"use client";/);
  });

  it('fetches the store profile from the real backend endpoint', () => {
    expect(page).toContain('/api/seller/store-profile');
  });

  it('saves via a real PUT request (not a fake setTimeout)', () => {
    expect(page).toMatch(/axios\.put\(['"]\/api\/seller\/store-profile['"]/);
    expect(page).not.toContain('setTimeout');
  });

  it('supports RTL layout (locale-aware dir attribute, not hardcoded ltr)', () => {
    expect(page).toMatch(/dir=\{?.*(rtl|isRtl|dir)/i);
  });

  it('includes logo and banner upload fields', () => {
    expect(page).toMatch(/type=["']file["']/);
    expect(page).toContain('logo');
    expect(page).toContain('banner');
  });
});
