/**
 * TDD — RED phase
 * Source-assertion test: seller layout.tsx must point the messages nav link
 * to /seller/messages (not /community/messages).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const layoutSrc = readFileSync(
  path.resolve(__dirname, '../layout.tsx'),
  'utf-8'
);

describe('seller layout — messages badge link', () => {
  it('links the messages nav item to /seller/messages', () => {
    // Must reference /seller/messages
    expect(layoutSrc).toContain('/seller/messages');
  });

  it('does NOT link the nav messages item to /community/messages', () => {
    // The nav messages item href must not be /community/messages
    // (The link in buildNavItems should be /seller/messages)
    // We check that the nav builder string does NOT contain the old buyer path
    // Note: it may still appear in other unrelated links, so we test the nav specifically
    const navBuilderMatch = layoutSrc.match(/buildNavItems[\s\S]*?return \[[\s\S]*?\]/);
    if (navBuilderMatch) {
      expect(navBuilderMatch[0]).not.toContain("'/community/messages'");
    } else {
      // Fallback: the isMessages guard must compare to /seller/messages
      expect(layoutSrc).toContain("'/seller/messages'");
    }
  });
});
