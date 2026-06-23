/**
 * TDD — RED phase
 * Tests for /community/posts/[id]/edit page behaviour.
 * Written BEFORE implementation — all tests must FAIL first.
 */

import { describe, it, expect } from 'vitest';

// ─── Task 2: edit page module must exist ─────────────────────────────────────
describe('community/posts/[id]/edit page', () => {
  it('page module exists at src/app/community/posts/[id]/edit/page.tsx', async () => {
    const mod = await import('../page');
    expect(mod).toBeTruthy();
    expect(typeof mod.default).toBe('function');
  }, 20000);
});

// ─── Task 2: communityService.updateCommunityPost must already exist ─────────
describe('communityService.updateCommunityPost', () => {
  it('exports an updateCommunityPost function', async () => {
    const mod = await import('@/services/communityService');
    expect(typeof mod.updateCommunityPost).toBe('function');
  });

  it('updateCommunityPost sends a PUT request (returns a promise)', async () => {
    const mod = await import('@/services/communityService');
    const result = mod.updateCommunityPost('1', new FormData());
    expect(typeof result.then).toBe('function');
    // Silence unhandled rejection from network in test env
    result.catch(() => {});
  });
});
