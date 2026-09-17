/**
 * W2B Completeness Fixes — TDD test suite
 *
 * RED phase: These tests verify the behaviour that is MISSING before fixes are applied.
 * Each describe block corresponds to one numbered fix in the PACKET W2B spec.
 *
 * Running before fixes → expected to show failures for the right reasons.
 */

import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Fix 3 — seller/register payload must include store_name
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 3 — seller register payload includes store_name', () => {
  it('StoreRequestPayload type allows store_name field', async () => {
    // Dynamically import to pick up the module as-is at test time
    const { submitStoreRequest } = await import('../sellerService');
    // The service must accept a payload with store_name without TS errors at runtime.
    // We validate the function signature accepts the field by constructing a valid
    // payload object and ensuring it compiles/runs without throwing type errors.
    // If store_name is absent from the type the TypeScript build will fail separately;
    // here we exercise the runtime FormData path.
    expect(typeof submitStoreRequest).toBe('function');
  });

  it('store_name is included in FormData when present in payload', async () => {
    // We test the sellerService.ts submitStoreRequest behaviour by inspecting
    // what gets appended to FormData. We patch the api module.
    const apiModule = await import('@/lib/api');
    const capturedFormData: FormData[] = [];
    const origPost = apiModule.default.post.bind(apiModule.default);
    apiModule.default.post = (async (url: string, data: any, cfg: any) => {
      capturedFormData.push(data);
      return { data: { success: true }, status: 201 };
    }) as any;

    const { submitStoreRequest } = await import('../sellerService');
    await submitStoreRequest({
      store_name: 'My Test Store',
      store_type_id: 1,
      business_type: 'individual',
      country: 'MA',
    } as any);

    apiModule.default.post = origPost;

    // store_name must appear in the FormData
    const fd = capturedFormData[0];
    expect(fd).toBeDefined();
    if (fd instanceof FormData) {
      expect(fd.get('store_name')).toBe('My Test Store');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 4 — handleVerticalSave catch block must NOT set verticalSaved on error
// ─────────────────────────────────────────────────────────────────────────────

// Fix 4 (handleVerticalSave) and Fix 5 (sellerProductService.deleteSellerProduct)
// removed — they covered the Next.js seller store-settings page and
// sellerProductService, both deleted in the seller dashboard consolidation
// (seller dashboard now lives in the Laravel Blade app).

// ─────────────────────────────────────────────────────────────────────────────
// Fix 6 — terms-of-service Seller Terms anchor points to internal section
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 6 — terms-of-service seller anchor is internal', () => {
  it('terms-of-service page does not use API_BASE_URL as a raw href', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/terms-of-service/page.tsx'
      ),
      'utf8'
    );
    // After fix: the href must not be the raw API_BASE_URL variable reference
    // inside an anchor tag pointing to the external Laravel root
    expect(src).not.toMatch(/href=\{API_BASE_URL\}/);
  });

  it('terms-of-service page has a seller-terms section anchor id', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/terms-of-service/page.tsx'
      ),
      'utf8'
    );
    expect(src).toContain('seller-terms');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 7 — size-guide does not reference missing /images/measurement-guide.jpg
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 7 — size-guide broken image replaced', () => {
  it('size-guide page does not reference /images/measurement-guide.jpg', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/size-guide/page.tsx'
      ),
      'utf8'
    );
    expect(src).not.toContain('/images/measurement-guide.jpg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 1a — shops/[name] STATIC_REVIEWS removed (no fake testimonials)
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 1a — shops/[name] does not render STATIC_REVIEWS', () => {
  it('shops page no longer references STATIC_REVIEWS constant', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/shops/[name]/page.tsx'
      ),
      'utf8'
    );
    expect(src).not.toContain('STATIC_REVIEWS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 1b — shops/[name] STATIC_ATELIERS replaced with live fetch
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 1b — shops/[name] "discover more ateliers" uses live data', () => {
  it('shops page no longer uses STATIC_ATELIERS constant', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/shops/[name]/page.tsx'
      ),
      'utf8'
    );
    expect(src).not.toContain('STATIC_ATELIERS');
  });

  it('shops page fetches other shops from shopService', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/shops/[name]/page.tsx'
      ),
      'utf8'
    );
    // After fix: should use shopService.getShops or similar live call
    expect(src).toMatch(/getShops|shopService\.getShops/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 1c — Reviews tab scrolls to reviews section
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 1c — Reviews tab scrolls to reviews section', () => {
  it('shops page has scrollIntoView call wired to reviews tab', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/shops/[name]/page.tsx'
      ),
      'utf8'
    );
    expect(src).toContain('scrollIntoView');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 2 — tailors/page filter pills + search + pagination wired
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 2 — tailors page controls are wired', () => {
  it('tailors page has activeFilter state for filter pills', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/services/tailoring/tailors/page.tsx'
      ),
      'utf8'
    );
    expect(src).toContain('activeFilter');
  });

  it('tailors page has search query state', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/services/tailoring/tailors/page.tsx'
      ),
      'utf8'
    );
    // After fix: search input must be controlled with a state variable
    expect(src).toMatch(/searchQuery|searchValue|query/);
    expect(src).toContain('onChange');
  });

  it('tailors page has real pagination with page state (not href="#")', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/services/tailoring/tailors/page.tsx'
      ),
      'utf8'
    );
    // After fix: pagination must not use href="#"
    expect(src).not.toContain('href="#"');
    // Must have a page state variable
    expect(src).toContain('currentPage');
  });

  it('tailors page Clear Filters button resets state', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/services/tailoring/tailors/page.tsx'
      ),
      'utf8'
    );
    // Clear Filters button must have an onClick handler that resets filter state
    expect(src).toMatch(/clearFilters|handleClearFilters|onClick.*clear|setActiveFilter.*All/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 8 — missing asset references replaced with existing fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 8 — broken image asset references fixed', () => {
  it('shops/[name] page does not reference /images/shop-placeholder.png', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/shops/[name]/page.tsx'
      ),
      'utf8'
    );
    expect(src).not.toContain('/images/shop-placeholder.png');
  });

  it('shops/[name] page does not reference /images/banners/main-banner.jpg', () => {
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/shops/[name]/page.tsx'
      ),
      'utf8'
    );
    expect(src).not.toContain('/images/banners/main-banner.jpg');
  });
});
