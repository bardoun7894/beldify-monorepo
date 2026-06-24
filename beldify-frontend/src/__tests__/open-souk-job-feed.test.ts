/**
 * Open Souk Job-Feed UI tests — TDD RED phase
 *
 * Covers:
 *   1. JobCard (PostCard.tsx) — new fields: proposal_count, buyer,
 *      required_skills chips, MAD budget range, timeline, status pill colours,
 *      relative posted-time
 *   2. JobFiltersPanel component — category, budget range, skills, status
 *   3. JobSortBar component — search input + sort dropdown
 *   4. community/page.tsx integration — imports new components, uses
 *      JobFilters + JobSort types, load-more / pagination, skeleton / empty
 *      / error states
 *
 * Strategy: readFileSync + toContain — same pattern as the rest of this
 * test suite. No React rendering needed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 1 — JobCard (PostCard.tsx) enrichments
// ─────────────────────────────────────────────────────────────────────────────
describe('PostCard.tsx — JobCard enrichments', () => {
  let card: string;

  // File must exist (it already does)
  it('PostCard.tsx exists', () => {
    expect(exists('src/components/community/PostCard.tsx')).toBe(true);
    card = read('src/components/community/PostCard.tsx');
  });

  it('renders proposal_count / proposalCount', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toMatch(/proposal_?[Cc]ount/);
  });

  it('renders buyer avatar or buyer name', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toContain('buyer');
  });

  it('renders required_skills or requiredSkills chips', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toMatch(/required_?[Ss]kills/);
  });

  it('renders MAD currency with .currency-mad class', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toContain('currency-mad');
  });

  it('renders budget_min/budget_max range display', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toMatch(/budget_?[Mm]in|budget_?[Mm]ax|budget/);
  });

  it('renders timeline field', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toContain('timeline');
  });

  it('shows open status pill with amber styling', () => {
    const c = read('src/components/community/PostCard.tsx');
    // open = amber pill per design system
    expect(c).toContain('amber');
    expect(c).toContain('open');
  });

  it('shows in_progress status with indigo styling', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toContain('indigo');
    expect(c).toContain('in_progress');
  });

  it('shows completed status with emerald/green styling', () => {
    const c = read('src/components/community/PostCard.tsx');
    expect(c).toMatch(/emerald|green/);
    expect(c).toContain('completed');
  });

  it('displays relative posted-time (time-ago)', () => {
    const c = read('src/components/community/PostCard.tsx');
    // Must have some time-relative logic (e.g. "منذ" or "ago" or date-fns)
    expect(c).toMatch(/ago|منذ|date-fns|formatDistanceToNow|timeAgo/i);
  });

  it('does NOT use white text on amber background (WCAG AA)', () => {
    const c = read('src/components/community/PostCard.tsx');
    // amber backgrounds must have dark text — no text-white on amber-*bg
    expect(c).not.toMatch(/bg-amber-[0-9]+ [^"]*text-white/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 2 — JobFiltersPanel component
// ─────────────────────────────────────────────────────────────────────────────
describe('JobFiltersPanel component', () => {
  it('JobFiltersPanel.tsx exists', () => {
    expect(
      exists('src/components/community/JobFiltersPanel.tsx')
    ).toBe(true);
  });

  it('JobFiltersPanel accepts onFiltersChange callback', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toMatch(/onFilters[Cc]hange|onChange/);
  });

  it('JobFiltersPanel has category filter', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('category');
  });

  it('JobFiltersPanel has budget_min filter', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('budget_min');
  });

  it('JobFiltersPanel has budget_max filter', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('budget_max');
  });

  it('JobFiltersPanel has skills filter', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('skills');
  });

  it('JobFiltersPanel has status filter', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('status');
  });

  it('JobFiltersPanel has a reset/clear button', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toMatch(/reset|clear|مسح/i);
  });

  it('JobFiltersPanel uses amber-200 ring (Atlas token)', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('amber');
  });

  it('JobFiltersPanel uses indigo-700 for primary action (Atlas CTA)', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('indigo-700');
  });

  it('JobFiltersPanel has mobile drawer support (isOpen / drawer prop)', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toMatch(/isOpen|drawer|mobile/i);
  });

  it('JobFiltersPanel uses rounded-2xl (Atlas shape token)', () => {
    const c = read('src/components/community/JobFiltersPanel.tsx');
    expect(c).toContain('rounded-2xl');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 3 — JobSortBar component
// ─────────────────────────────────────────────────────────────────────────────
describe('JobSortBar component', () => {
  it('JobSortBar.tsx exists', () => {
    expect(
      exists('src/components/community/JobSortBar.tsx')
    ).toBe(true);
  });

  it('JobSortBar has a search input', () => {
    const c = read('src/components/community/JobSortBar.tsx');
    expect(c).toMatch(/input|Search/i);
  });

  it('JobSortBar has sort options (latest, oldest, budget_asc, budget_desc)', () => {
    const c = read('src/components/community/JobSortBar.tsx');
    expect(c).toContain('latest');
    expect(c).toContain('oldest');
    expect(c).toContain('budget_asc');
    expect(c).toContain('budget_desc');
  });

  it('JobSortBar emits onSearch callback', () => {
    const c = read('src/components/community/JobSortBar.tsx');
    expect(c).toMatch(/onSearch|onQuery/);
  });

  it('JobSortBar emits onSort callback', () => {
    const c = read('src/components/community/JobSortBar.tsx');
    expect(c).toContain('onSort');
  });

  it('JobSortBar has a filter toggle button for mobile', () => {
    const c = read('src/components/community/JobSortBar.tsx');
    expect(c).toMatch(/filter|SlidersHorizontal|onFilter/i);
  });

  it('JobSortBar uses indigo-700 or indigo brand for search submit', () => {
    const c = read('src/components/community/JobSortBar.tsx');
    expect(c).toContain('indigo');
  });

  it('JobSortBar uses sticky or top positioning for sticky bar', () => {
    const c = read('src/components/community/JobSortBar.tsx');
    expect(c).toMatch(/sticky|top-/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 4 — community/page.tsx integration
// ─────────────────────────────────────────────────────────────────────────────
describe('community/page.tsx — integration with new components', () => {
  it('imports JobFiltersPanel', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toContain('JobFiltersPanel');
  });

  it('imports JobSortBar', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toContain('JobSortBar');
  });

  it('uses budget_min filter state', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toContain('budget_min');
  });

  it('uses budget_max filter state', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toContain('budget_max');
  });

  it('uses sort state variable', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toMatch(/sort|Sort/);
  });

  it('passes sort param to fetchCommunityPosts', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toMatch(/fetchCommunityPosts\(.*sort|sort.*fetchCommunityPosts/s);
  });

  it('passes q (search) param to fetchCommunityPosts', () => {
    const p = read('src/app/community/page.tsx');
    // q or searchQuery forwarded to service
    expect(p).toMatch(/q:|searchQuery|search.*fetch/s);
  });

  it('has skeleton loading state for cards', () => {
    const p = read('src/app/community/page.tsx');
    // skeleton = either a Skeleton component import or animate-pulse classes
    expect(p).toMatch(/skeleton|animate-pulse|Skeleton/i);
  });

  it('has empty-state block for zero posts', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toMatch(/length.*===.*0|posts\.length|empty/i);
  });

  it('has error-state block', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toMatch(/error|Error/);
  });

  it('has load-more or pagination', () => {
    const p = read('src/app/community/page.tsx');
    expect(p).toMatch(/Pagination|loadMore|load.more|totalPages/i);
  });

  it('two-column layout: feed column + filter sidebar on desktop', () => {
    const p = read('src/app/community/page.tsx');
    // lg:grid-cols or lg:flex with a sidebar/aside
    expect(p).toMatch(/lg:grid-cols|lg:flex/);
    expect(p).toMatch(/aside|sidebar/i);
  });
});
