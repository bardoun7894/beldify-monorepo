// @vitest-environment node
/**
 * TDD — B3: the seller dashboard is LIGHT-ONLY.
 *
 * Dark mode is an explicit non-goal for /seller/*. This guard fails if anyone
 * (a) renders the ThemeToggle inside the seller tree, or
 * (b) introduces a `dark:` Tailwind variant anywhere under src/app/seller.
 *
 * Light Atlas tokens only.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SELLER_DIR = join(__dirname, '..', '..', 'seller'); // src/app/seller

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === '__tests__') continue; // tests may legitimately mention dark:/ThemeToggle
      out.push(...walk(full));
    } else if (/\.(tsx?|jsx?)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const sellerFiles = walk(SELLER_DIR);

describe('B3 — seller dashboard is light-only', () => {
  it('finds seller source files to scan', () => {
    expect(sellerFiles.length).toBeGreaterThan(0);
  });

  it('does NOT render the ThemeToggle anywhere under src/app/seller', () => {
    const offenders = sellerFiles.filter((f) =>
      /ThemeToggle/.test(readFileSync(f, 'utf-8'))
    );
    expect(offenders).toEqual([]);
  });

  it('does NOT use any `dark:` Tailwind variant under src/app/seller', () => {
    const offenders = sellerFiles.filter((f) =>
      /\bdark:/.test(readFileSync(f, 'utf-8'))
    );
    expect(offenders).toEqual([]);
  });

  it('the seller layout does not import ThemeToggle', () => {
    const layout = readFileSync(join(SELLER_DIR, 'layout.tsx'), 'utf-8');
    expect(layout).not.toMatch(/ThemeToggle/);
  });
});
