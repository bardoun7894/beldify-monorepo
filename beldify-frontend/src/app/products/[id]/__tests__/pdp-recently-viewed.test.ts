/**
 * TDD — PDP recently-viewed tracking static analysis test
 *
 * Verifies that page.tsx:
 *   - imports addRecentlyViewed from @/utils/recentlyViewed
 *   - calls addRecentlyViewed inside a useEffect keyed on [product]
 *   - passes the correct shape { id, name, image, price }
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..', '..', '..');
const PAGE_FILE = join(ROOT, 'src/app/products/[id]/page.tsx');

function readPage(): string {
  return readFileSync(PAGE_FILE, 'utf-8');
}

describe('PDP — recently-viewed tracking', () => {
  it('imports addRecentlyViewed from @/utils/recentlyViewed', () => {
    const page = readPage();
    expect(page).toMatch(/import.*addRecentlyViewed.*from\s+['"]@\/utils\/recentlyViewed['"]/);
  });

  it('calls addRecentlyViewed inside a useEffect', () => {
    const page = readPage();
    expect(page).toContain('addRecentlyViewed');
    // Find the call-site (not the import line) by looking for addRecentlyViewed(
    const callIdx = page.indexOf('addRecentlyViewed(');
    expect(callIdx, 'addRecentlyViewed( call not found').toBeGreaterThan(-1);
    const beforeCall = page.slice(0, callIdx);
    // There should be a useEffect( opening before the call
    expect(beforeCall).toMatch(/useEffect\s*\(/);
  });

  it('passes id field (Number converted) to addRecentlyViewed', () => {
    const page = readPage();
    // The call should pass an object with id: Number(product.id)
    expect(page).toMatch(/addRecentlyViewed\s*\(\s*\{/);
    expect(page).toMatch(/Number\(.*product\.id\)|id:\s*Number/);
  });

  it('passes name field from product', () => {
    const page = readPage();
    expect(page).toMatch(/name\s*:\s*product\.name/);
  });

  it('passes image field (main_image fallback to empty string)', () => {
    const page = readPage();
    expect(page).toMatch(/image\s*:\s*product\.main_image/);
  });

  it('passes price field from product', () => {
    const page = readPage();
    expect(page).toMatch(/price\s*:\s*product\.price/);
  });

  it('the useEffect tracking is keyed on [product] dependency', () => {
    const page = readPage();
    // Find the addRecentlyViewed call and check its surrounding effect deps
    const callIdx = page.indexOf('addRecentlyViewed(');
    // Find the closing ], [product] pattern after the call
    const afterCall = page.slice(callIdx, callIdx + 500);
    expect(afterCall).toMatch(/\},\s*\[product\]/);
  });
});
