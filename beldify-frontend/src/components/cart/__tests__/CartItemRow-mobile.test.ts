import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mobile-adaptation tests for CartItemRow — quantity stepper and remove
 * button must meet the 44x44px WCAG 2.5.5 minimum touch-target size.
 * Beldify buyers are overwhelmingly on small Android screens; a mis-tap on
 * the quantity stepper in the cart is a real conversion cost.
 */

const COMPONENT_PATH = path.resolve(__dirname, '../CartItemRow.tsx');

function readComponent(): string {
  return fs.readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('CartItemRow — mobile touch targets', () => {
  it('quantity decrease/increase buttons are at least 44x44px (not w-7 h-7)', () => {
    const src = readComponent();
    // The old undersized hit area — must no longer be present on the stepper buttons
    expect(src).not.toMatch(/w-7 h-7 flex items-center justify-center text-indigo-500/);
  });

  it('quantity stepper buttons declare a min 44px hit area (min-w-\\[44px\\] min-h-\\[44px\\] or w-11 h-11)', () => {
    const src = readComponent();
    const decreaseBtn = src.match(/onQuantityChange\(item\.id, item\.quantity - 1\)[\s\S]{0,400}/)?.[0] ?? '';
    const increaseBtn = src.match(/onQuantityChange\(item\.id, item\.quantity \+ 1\)[\s\S]{0,400}/)?.[0] ?? '';
    const has44 = (block: string) =>
      /min-w-\[44px\]|w-11 h-11|min-h-\[44px\]/.test(block);
    expect(has44(decreaseBtn)).toBe(true);
    expect(has44(increaseBtn)).toBe(true);
  });

  it('remove (trash) button declares a min 44px hit area', () => {
    const src = readComponent();
    const removeBtn = src.match(/onClick=\{\(\) => onRemove\(item\.id\)\}[\s\S]{0,400}/)?.[0] ?? '';
    expect(/min-w-\[44px\]|w-11 h-11|min-h-\[44px\]/.test(removeBtn)).toBe(true);
  });
});
