/**
 * TDD — RED phase
 * Tests for /community/my-posts page behaviour and communityService extensions.
 * Written BEFORE implementation — all tests must FAIL first.
 */

import { describe, it, expect } from 'vitest';

// ─── Task 1: /community/my-posts page file must exist ────────────────────────
describe('community/my-posts page', () => {
  it('page module exists at src/app/community/my-posts/page.tsx', async () => {
    // Dynamic import will throw if the module does not exist
    const mod = await import('../page');
    expect(mod).toBeTruthy();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── Task 1: communityService must export fetchMyPosts ───────────────────────
describe('communityService.fetchMyPosts', () => {
  it('exports a fetchMyPosts function', async () => {
    const mod = await import('@/services/communityService');
    expect(typeof (mod as any).fetchMyPosts).toBe('function');
  });

  it('fetchMyPosts returns a promise', async () => {
    const mod = await import('@/services/communityService');
    const fn = (mod as any).fetchMyPosts;
    // Should return a thenable (Promise). We don't need it to resolve — just type-check.
    const result = fn({ page: 1, per_page: 20 });
    expect(typeof result.then).toBe('function');
    // Silence unhandled rejection in test environment
    result.catch(() => {});
  });
});

// ─── Task 3: communityService must export closePost ─────────────────────────
describe('communityService.closePost', () => {
  it('exports a closePost function', async () => {
    const mod = await import('@/services/communityService');
    expect(typeof (mod as any).closePost).toBe('function');
  });
});
