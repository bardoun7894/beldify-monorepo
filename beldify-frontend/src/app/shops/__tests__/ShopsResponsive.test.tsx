/**
 * TDD — mobile/adapt static-analysis coverage for the shops list, shop
 * detail filter/sort controls, and the homepage hero carousels.
 *
 * Verifies every interactive control the /adapt + /audit pass touched has a
 * WCAG 2.5.5-safe >=44px touch target on real Android phones (320-414px).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const shopsPage = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf-8');
const shopFilterBar = readFileSync(
  join(__dirname, '..', '..', '..', 'components', 'shops', 'ShopFilterBar.tsx'),
  'utf-8'
);
const shopFilters = readFileSync(
  join(__dirname, '..', '..', '..', 'components', 'shops', 'ShopFilters.tsx'),
  'utf-8'
);
const shopSort = readFileSync(
  join(__dirname, '..', '..', '..', 'components', 'shops', 'ShopSort.tsx'),
  'utf-8'
);
const heroSection = readFileSync(
  join(__dirname, '..', '..', '..', 'components', 'home', 'HeroSection.tsx'),
  'utf-8'
);
const productHeroSlides = readFileSync(
  join(__dirname, '..', '..', '..', 'components', 'home', 'ProductHeroSlides.tsx'),
  'utf-8'
);

describe('shops list page — touch targets (>=44px)', () => {
  it('search input and search submit button are >=44px tall', () => {
    expect(shopsPage).toMatch(/ps-9 w-full text-sm min-h-\[44px\]/);
    const searchButtonBlock = shopsPage.slice(
      shopsPage.indexOf('type="submit"'),
      shopsPage.indexOf('type="submit"') + 300
    );
    expect(searchButtonBlock).toMatch(/min-h-\[44px\]/);
  });

  it('pagination Prev/Next buttons and numbered page buttons are >=44px', () => {
    const prevNextMatches = shopsPage.match(
      /border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-5 min-h-\[44px\]/g
    ) || [];
    expect(prevNextMatches.length).toBe(2); // Previous + Next

    expect(shopsPage).toMatch(/w-11 h-11 min-w-\[44px\] min-h-\[44px\] rounded-full/);
  });

  it('error and empty-state action buttons are >=44px', () => {
    expect(shopsPage).toMatch(/rounded-full bg-indigo-700 hover:bg-indigo-800 text-white px-6 min-h-\[44px\]/);
    expect(shopsPage).toMatch(/border-indigo-700 text-indigo-700 hover:bg-indigo-50 px-6 min-h-\[44px\]/);
  });
});

describe('ShopFilterBar — touch targets (>=44px)', () => {
  it('scroll-start and scroll-end buttons meet the 44px minimum', () => {
    const matches = shopFilterBar.match(/min-h-\[44px\] min-w-\[44px\]/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('the filters trigger and every type pill are >=44px tall', () => {
    expect(shopFilterBar).toMatch(/px-2\.5 sm:px-3 py-1\.5 rounded-full min-h-\[44px\]/);
    expect(shopFilterBar).toMatch(
      /px-2\.5 sm:px-3 py-1\.5 rounded-full min-h-\[44px\]',\s*\n\s*isActive/
    );
  });
});

describe('ShopFilters drawer — touch targets (>=44px)', () => {
  it('the close (X) button has a 44x44 hit area', () => {
    expect(shopFilters).toMatch(/min-h-\[44px\] min-w-\[44px\] flex items-center justify-center/);
  });

  it('every seller-type option and "clear all filters" are >=44px tall', () => {
    expect(shopFilters).toMatch(/w-full justify-start rounded-full transition-all duration-150 min-h-\[44px\]/);
    expect(shopFilters).toMatch(/w-full rounded-full text-indigo-700 hover:bg-indigo-50 min-h-\[44px\]/);
  });
});

describe('ShopSort — touch target (>=44px)', () => {
  it('the sort trigger is >=44px tall', () => {
    expect(shopSort).toMatch(/w-\[180px\] min-h-\[44px\] rounded-2xl/);
  });
});

describe('Homepage hero carousels — pagination dot tap target (>=44px)', () => {
  it('HeroSection keeps the 8px Atlas dot visually but grows the tap target to 44px', () => {
    expect(heroSection).toMatch(/\.hero-swiper \.swiper-pagination-bullet \{[^}]*position: relative/);
    expect(heroSection).toMatch(/\.hero-swiper \.swiper-pagination-bullet::before \{[^}]*width: 44px;\s*height: 44px;/);
  });

  it('ProductHeroSlides keeps the 8px Atlas dot visually but grows the tap target to 44px', () => {
    expect(productHeroSlides).toMatch(/\.product-hero-swiper \.swiper-pagination-bullet \{[^}]*position: relative/);
    expect(productHeroSlides).toMatch(
      /\.product-hero-swiper \.swiper-pagination-bullet::before \{[^}]*width: 44px;\s*height: 44px;/
    );
  });
});
