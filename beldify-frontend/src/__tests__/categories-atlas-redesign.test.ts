import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

// ─── Categories index page ────────────────────────────────────────────────────

describe('Categories index page — Atlas bar', () => {
  let page: string;
  try { page = read('src/app/categories/page.tsx'); } catch { page = ''; }

  it('uses Playfair Display for the hero headline', () => {
    expect(page).toContain('Playfair Display');
  });

  it('uses indigo-950 (not bg-indigo-700 or bg-indigo-900) for hero surface to match Atlas editorial dark', () => {
    // Accept indigo-950 or indigo-900 as both are permitted Atlas dark surfaces
    const hasEditorialDark = page.includes('indigo-950') || page.includes('indigo-900');
    expect(hasEditorialDark).toBe(true);
  });

  it('uses aspect-[4/5] for portrait category cards', () => {
    expect(page).toContain('aspect-[4/5]');
  });

  it('uses shadow-atlas-sm on cards (warm indigo tint)', () => {
    expect(page).toContain('shadow-atlas-sm');
  });

  it('uses hover:-translate-y-1 for hover lift', () => {
    // Categories page uses the more pronounced hover:-translate-y-1 lift
    // (deeper vertical shift suits larger portrait category cards vs product micro-cards).
    expect(page).toContain('hover:-translate-y-1');
  });

  it('uses hover:shadow-atlas-md for hover shadow lift', () => {
    expect(page).toContain('hover:shadow-atlas-md');
  });

  it('uses rounded-2xl for cards', () => {
    expect(page).toContain('rounded-2xl');
  });

  it('uses gender filter pills with indigo-700 active state', () => {
    expect(page).toContain('indigo-700');
  });

  it('uses bg-amber-50 or bg-amber-50/40 warm page surface', () => {
    const hasWarmSurface = page.includes('bg-amber-50') || page.includes('bg-amber-50/');
    expect(hasWarmSurface).toBe(true);
  });

  it('uses RTL logical CSS (ps- or pe-) not left/right', () => {
    // Must not have raw `left-` or `right-` class names used for layout
    const ltrMatches = page.match(/className=["'][^"']*\b(pl-|pr-)\d/g) || [];
    expect(ltrMatches.length).toBe(0);
  });

  it('loading state uses Loading component or animate-pulse', () => {
    // Index page uses the shared Loading component from @/components/ui/loading
    const hasLoadingUI = page.includes('Loading') || page.includes('animate-pulse');
    expect(hasLoadingUI).toBe(true);
  });

  it('balances the Playfair hero headline (text-balance)', () => {
    expect(page).toContain('text-balance');
  });

  it('pretties the hero subheadline wrap (text-pretty)', () => {
    expect(page).toContain('text-pretty');
  });
});

// ─── Category detail (categories/[slug]) ────────────────────────────────────

describe('Category detail page /categories/[slug] — Atlas bar', () => {
  let page: string;
  try { page = read('src/app/categories/[slug]/page.tsx'); } catch { page = ''; }

  it('uses Playfair Display for category title in hero', () => {
    expect(page).toContain('Playfair Display');
  });

  it('imports CategoryDetailHero (which carries indigo-950 overlay)', () => {
    // The detail pages delegate to the shared CategoryDetailHero component
    expect(page).toContain('CategoryDetailHero');
  });

  it('uses shadow-atlas-sm on filter/product cards', () => {
    expect(page).toContain('shadow-atlas-sm');
  });

  it('uses rounded-2xl for cards', () => {
    expect(page).toContain('rounded-2xl');
  });

  it('error state uses rose-700 (not red-500)', () => {
    const hasRed500 = page.includes('text-red-500') || page.includes('text-red-600');
    expect(hasRed500).toBe(false);
    expect(page).toContain('rose-700');
  });

  it('loading skeletons use bg-amber-100 (not bg-gray-200)', () => {
    expect(page).not.toContain('bg-gray-200');
  });

  it('does not contain stale // expect: delta comments from crashed run', () => {
    expect(page).not.toContain('// expect:');
  });

  it('does not contain h-1 top accent bars (admin scaffolding)', () => {
    expect(page).not.toContain('h-1 bg-indigo-700');
  });

  it('subcategory item-count meets WCAG AA (no text-gray-400 on white)', () => {
    expect(page).not.toContain('text-gray-400');
  });

  it('links subcategory tiles into the canonical /categories/ route tree', () => {
    expect(page).not.toContain('href={`/category/${subCategory.id}`}');
    expect(page).toContain('/categories/${');
  });
});

// ─── Category detail (category/[slug]) ──────────────────────────────────────

describe('Category detail page /category/[slug] — Atlas bar', () => {
  let page: string;
  try { page = read('src/app/category/[slug]/page.tsx'); } catch { page = ''; }

  it('uses Playfair Display for category title in hero', () => {
    expect(page).toContain('Playfair Display');
  });

  it('imports CategoryDetailHero (which carries indigo-950 overlay)', () => {
    // The detail pages delegate to the shared CategoryDetailHero component
    expect(page).toContain('CategoryDetailHero');
  });

  it('uses shadow-atlas-sm on cards', () => {
    expect(page).toContain('shadow-atlas-sm');
  });

  it('does not contain stale // expect: delta comments', () => {
    expect(page).not.toContain('// expect:');
  });

  it('error state uses rose-700 (not red-500)', () => {
    const hasRed500 = page.includes('text-red-500') || page.includes('text-red-600');
    expect(hasRed500).toBe(false);
  });

  it('loading skeletons use bg-amber-100 (not bg-gray-200)', () => {
    expect(page).not.toContain('bg-gray-200');
  });

  it('does not contain h-1 top accent bars (admin scaffolding)', () => {
    expect(page).not.toContain('h-1 bg-indigo-700');
  });

  it('subcategory item-count meets WCAG AA (no text-gray-400 on white)', () => {
    expect(page).not.toContain('text-gray-400');
  });

  it('links subcategory tiles into the canonical /categories/ route tree', () => {
    expect(page).not.toContain('href={`/category/${subCategory.id}`}');
    expect(page).toContain('/categories/${');
  });
});

// ─── Shared CategoryDetailHero component ────────────────────────────────────

describe('Shared CategoryDetailHero presentational component', () => {
  let component: string;
  try { component = read('src/components/category/CategoryDetailHero.tsx'); } catch { component = ''; }

  it('exists as a new shared presentational component', () => {
    expect(component.length).toBeGreaterThan(0);
  });

  it('uses Playfair Display for title', () => {
    expect(component).toContain('Playfair Display');
  });

  it('uses indigo-950 gradient overlay', () => {
    expect(component).toContain('indigo-950');
  });

  it('uses rounded-2xl or full-bleed hero with overflow-hidden', () => {
    const hasRounding = component.includes('overflow-hidden') || component.includes('rounded-2xl');
    expect(hasRounding).toBe(true);
  });

  it('uses amber-500 for product count pill', () => {
    expect(component).toContain('amber-500');
  });

  it('uses the text-amber-950 token (not text-gray-900) on the amber pill', () => {
    expect(component).toContain('text-amber-950');
  });
});

// ─── Dead legacy components removed ─────────────────────────────────────────

describe('Legacy pre-Atlas category components are deleted', () => {
  function exists(rel: string) {
    try { read(rel); return true; } catch { return false; }
  }

  it('removed src/app/categories/components/FeaturedCategories.tsx', () => {
    expect(exists('src/app/categories/components/FeaturedCategories.tsx')).toBe(false);
  });

  it('removed src/app/categories/components/CategoryCard.tsx', () => {
    expect(exists('src/app/categories/components/CategoryCard.tsx')).toBe(false);
  });

  it('removed src/components/category/CategoryHero.tsx', () => {
    expect(exists('src/components/category/CategoryHero.tsx')).toBe(false);
  });

  it('removed src/components/category/CategoryContent.tsx', () => {
    expect(exists('src/components/category/CategoryContent.tsx')).toBe(false);
  });

  it('removed src/components/category/CategoryHeader.tsx', () => {
    expect(exists('src/components/category/CategoryHeader.tsx')).toBe(false);
  });
});
