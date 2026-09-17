/**
 * /seller/store-profile — config-level permanent redirect (TDD, source-reading)
 *
 * HISTORY: first shipped as a full in-Next store-profile editor, then the
 * 2026-06-29 consolidation made the Blade dashboard the owner of profile
 * editing. A page-level permanentRedirect() prerendered to a 200 HTML page
 * in the standalone prod build (no 308), so the redirect now lives in
 * next.config.js/next.config.prod.js redirects() — same mechanism as the
 * /category → /categories canonicalization — and the page file is deleted.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf-8');

describe('seller store-profile redirect', () => {
  it('page file is deleted (no duplicate in-Next editor)', () => {
    expect(existsSync(join(ROOT, 'src/app/seller/store-profile/page.tsx'))).toBe(false);
  });

  for (const cfg of ['next.config.js', 'next.config.prod.js']) {
    it(`${cfg} permanently redirects /seller/store-profile to /seller/register`, () => {
      const src = read(cfg);
      expect(src).toMatch(/source:\s*['"]\/seller\/store-profile['"]/);
      expect(src).toMatch(/destination:\s*['"]\/seller\/register['"]/);
    });
  }
});
