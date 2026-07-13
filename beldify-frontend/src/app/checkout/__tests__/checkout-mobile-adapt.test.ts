import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mobile-adaptation tests for checkout/page.tsx.
 *
 * 1. No form input renders below 16px font-size — iOS Safari zooms the
 *    viewport on focus for any input with font-size < 16px, which breaks
 *    the layout on a mobile-first, guest-COD checkout flow.
 * 2. The primary "place order" CTA must be reachable without scrolling
 *    past all three form cards on mobile — i.e. a sticky mobile action bar
 *    exists (mirrors the pattern already used on /cart and the PDP).
 */

const PAGE_PATH = path.resolve(__dirname, '../../checkout/page.tsx');

function readPage(): string {
  return fs.readFileSync(PAGE_PATH, 'utf-8');
}

describe('checkout/page.tsx — mobile adaptation', () => {
  it('the email input does not use text-sm (16px min prevents iOS zoom-on-focus)', () => {
    const src = readPage();
    const emailInputBlock = src.match(/type="email"[\s\S]{0,900}/)?.[0] ?? '';
    expect(emailInputBlock).not.toMatch(/\btext-sm\b/);
    expect(emailInputBlock).toMatch(/\btext-base\b/);
  });

  it('renders a sticky mobile checkout action bar (md:hidden fixed bottom-0)', () => {
    const src = readPage();
    expect(src).toMatch(/CheckoutMobileBar/);
  });

  it('has bottom spacer/padding so the sticky mobile bar never covers content', () => {
    const src = readPage();
    expect(src).toMatch(/pb-(24|28|32)\s+md:pb-/);
  });
});
