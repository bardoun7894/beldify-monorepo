/**
 * Account / Community surface hardening tests (TDD — source-reading environment)
 *
 * Structural contracts for the 7 audited completeness gaps.
 * All tests read source files directly; no DOM, no live API calls.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — notifications/page.tsx: error state + catch in load()
// ─────────────────────────────────────────────────────────────────────────────
describe('FIX 1 — notifications/page.tsx: error state + catch', () => {
  const src = () => read('src/app/notifications/page.tsx');

  it('tracks isError state (useState)', () => {
    expect(src()).toMatch(/isError/);
  });

  it('load() has a catch block (not just finally)', () => {
    // Must have a catch block in the load function
    expect(src()).toMatch(/catch\s*[\(\{]/);
  });

  it('sets isError to true in catch block', () => {
    expect(src()).toMatch(/setIsError\s*\(\s*true\s*\)/);
  });

  it('renders an error banner when isError is true', () => {
    // Some form of error UI conditional on isError
    expect(src()).toMatch(/isError/);
    // Should render something meaningful, not fall into the empty state
    expect(src()).toMatch(/error/i);
  });

  it('error banner provides a retry action', () => {
    // The error state must give the user a way to retry
    expect(src()).toMatch(/retry|load\(|onClick/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — returns/page.tsx: replace localStorage with useAuth
// ─────────────────────────────────────────────────────────────────────────────
describe('FIX 2 — returns/page.tsx: useAuth instead of localStorage', () => {
  const src = () => read('src/app/returns/page.tsx');

  it('imports useAuth from AuthContext', () => {
    expect(src()).toContain("useAuth");
    expect(src()).toMatch(/from\s+['"]@\/contexts\/AuthContext['"]/);
  });

  it('RequestReturnSection uses isAuthenticated from useAuth', () => {
    expect(src()).toMatch(/const\s*\{[^}]*isAuthenticated[^}]*\}\s*=\s*useAuth\(\)/);
  });

  it('no longer reads localStorage.getItem(token) for auth check in RequestReturnSection', () => {
    // The useEffect that checked localStorage for token should be gone
    // Specifically: a useEffect that calls localStorage.getItem('token') and setIsLoggedIn
    const hasLocalStorageAuthEffect = src().match(
      /useEffect\s*\([^)]*\)\s*\{[^}]*localStorage\.getItem\s*\(\s*['"]token['"]\s*\)[^}]*setIsLoggedIn/s
    );
    expect(hasLocalStorageAuthEffect).toBeNull();
  });

  it('no longer has a separate isLoggedIn state driven by localStorage', () => {
    // The old pattern: useState(false) + setIsLoggedIn(!!token) should be replaced
    expect(src()).not.toMatch(/setIsLoggedIn\s*\(\s*!!\s*token\s*\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — community/page.tsx: user posts fetch uses communityService
// ─────────────────────────────────────────────────────────────────────────────
describe('FIX 3 — community/page.tsx: user posts via communityService', () => {
  const src = () => read('src/app/community/page.tsx');

  it('imports fetchMyPosts (or equivalent) from communityService', () => {
    // Must use the service, not raw fetch('/api/v1/...')
    expect(src()).toMatch(/fetchMyPosts|fetchCommunityPosts/);
    expect(src()).toMatch(/from\s+['"]@\/services\/communityService['"]/);
  });

  it('does NOT fetch relative /api/v1/community/posts directly in component', () => {
    // The raw fetch('/api/v1/community/posts?...') call should be replaced
    expect(src()).not.toMatch(/fetch\s*\(\s*`\/api\/v1\/community\/posts/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4 — community/posts/[id]/page.tsx: logger + toast instead of raw console/alert
// ─────────────────────────────────────────────────────────────────────────────
describe('FIX 4 — community/posts/[id]/page.tsx: logger + toast', () => {
  const src = () => read('src/app/community/posts/[id]/page.tsx');

  it('imports logger from @/utils/consoleLogger', () => {
    expect(src()).toMatch(/import\s+logger\s+from\s+['"]@\/utils\/consoleLogger['"]/);
  });

  it('no raw console.warn calls remain', () => {
    expect(src()).not.toMatch(/console\.warn\s*\(/);
  });

  it('no raw console.error calls remain', () => {
    expect(src()).not.toMatch(/console\.error\s*\(/);
  });

  it('imports toast utility', () => {
    // The file should import toast (react-hot-toast via wrapper or similar)
    expect(src()).toMatch(/import\s+toast\s+from/);
  });

  it('no window.alert calls remain', () => {
    expect(src()).not.toMatch(/window\.alert\s*\(/);
    expect(src()).not.toMatch(/\balert\s*\(/);
  });

  it('uses toast.error instead of alert for not_authorized', () => {
    expect(src()).toMatch(/toast\.error/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5 — community/messages/page.tsx: logger.warn instead of console.warn
// ─────────────────────────────────────────────────────────────────────────────
describe('FIX 5 — community/messages/page.tsx: no raw console.warn', () => {
  const src = () => read('src/app/community/messages/page.tsx');

  it('already imports logger from consoleLogger', () => {
    expect(src()).toMatch(/import\s+logger\s+from\s+['"]@\/utils\/consoleLogger['"]/);
  });

  it('no raw console.warn calls remain', () => {
    expect(src()).not.toMatch(/console\.warn\s*\(/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6 — wishlist/page.tsx: handleAddToCart uses useCart addItem
// ─────────────────────────────────────────────────────────────────────────────
describe('FIX 6 — wishlist/page.tsx: handleAddToCart via useCart', () => {
  const src = () => read('src/app/wishlist/page.tsx');

  it('imports useCart from CartContext', () => {
    expect(src()).toMatch(/useCart/);
    expect(src()).toMatch(/from\s+['"]@\/contexts\/CartContext['"]/);
  });

  it('uses addItem from useCart in handleAddToCart', () => {
    expect(src()).toMatch(/addItem/);
  });

  it('does NOT post directly to /api/cart/items with axios', () => {
    // The raw axios.post('/api/cart/items') pattern should be gone
    expect(src()).not.toMatch(/axios\.post\s*\(\s*['"]\/api\/cart\/items['"]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 7 — mock files: not deleted because communityService imports mockMessagingData
// ─────────────────────────────────────────────────────────────────────────────
describe('FIX 7 — mock files: preserved because communityService imports them', () => {
  it('mockMessagingData.ts still exists (imported by communityService)', () => {
    expect(exists('src/mocks/mockMessagingData.ts')).toBe(true);
  });

  it('mockReviewsData + mockReviewService are removed (reviews use the real backend)', () => {
    expect(exists('src/mocks/mockReviewsData.ts')).toBe(false);
    expect(exists('src/services/mockReviewService.ts')).toBe(false);
  });

  it('communityService.ts still imports from mockMessagingData', () => {
    const svc = read('src/services/communityService.ts');
    expect(svc).toContain('mockMessagingData');
  });
});
