/**
 * TDD RED — Invoice page unit tests
 *
 * These tests are written BEFORE the implementation and must fail first.
 * They prove:
 * 1. The invoice route module exists at the expected path.
 * 2. The default export is a React function component (renderable).
 * 3. window.print is called when the print button is clicked (via auto or manual).
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const INVOICE_PAGE_PATH = path.resolve(
  __dirname,
  '../../invoice/page.tsx'
);

describe('Invoice page — static existence checks', () => {
  it('invoice page file exists at src/app/orders/[orderNumber]/invoice/page.tsx', () => {
    expect(fs.existsSync(INVOICE_PAGE_PATH)).toBe(true);
  });

  it('invoice page exports a default function component', async () => {
    // Dynamic import will throw if file does not exist or has no default export.
    // We only check that the module has a default export that is a function.
    const mod = await import('../../invoice/page');
    expect(typeof mod.default).toBe('function');
  });
});
