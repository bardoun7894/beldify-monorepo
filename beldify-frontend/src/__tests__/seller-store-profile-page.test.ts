/**
 * Seller store-profile Next.js page (TDD, source-reading)
 *
 * HISTORY: this page was first added as a full in-Next store-profile editor
 * wired to GET/PUT /api/seller/store-profile. After the 2026-06-29 seller
 * dashboard consolidation the Blade dashboard owns store-profile editing;
 * keeping a second editor here risked divergent data (2026-07-12 audit).
 * The route now permanently redirects to /seller/register, which bridges
 * sellers into the Blade dashboard via the /seller/enter SSO handoff.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf-8');

const page = read('src/app/seller/store-profile/page.tsx');

describe('seller store-profile page', () => {
  it('permanently redirects to the consolidated seller entry', () => {
    expect(page).toMatch(/permanentRedirect\(['"]\/seller\/register['"]\)/);
    expect(page).toMatch(/from ['"]next\/navigation['"]/);
  });

  it('is no longer a duplicate in-Next profile editor (no API calls, no client state)', () => {
    expect(page).not.toMatch(/use client/);
    expect(page).not.toMatch(/api\/seller\/store-profile/);
    expect(page).not.toMatch(/useState|useEffect/);
  });

  it('documents why (Blade dashboard owns store-profile editing)', () => {
    expect(page).toMatch(/Blade seller dashboard/i);
  });
});
