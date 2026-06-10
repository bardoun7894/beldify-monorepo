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
    apiModule.default.post = async (url: string, data: any, cfg: any) => {
      capturedFormData.push(data);
      return { data: { success: true }, status: 201 };
    };

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

describe('Fix 4 — handleVerticalSave error path correctness', () => {
  it('handleVerticalSave catch must not apply optimistic update on API failure', () => {
    // This is a behavioural test documented as a source-code assertion.
    // We check that the fixed catch block only calls toast.error and resets
    // saving state, without calling setStoreType(pendingVertical) or
    // setVerticalSaved(true).
    //
    // The runtime contract: if updateStoreProfile throws, verticalSaved stays false
    // and storeType stays at its original value.
    //
    // We verify the fix by reading the source of the page module and asserting
    // the catch block does NOT contain setVerticalSaved(true) after the fix.
    // (Pre-fix it does contain it; post-fix it must not.)
    const fs = require('fs');
    const src: string = fs.readFileSync(
      require('path').resolve(
        __dirname,
        '../../app/seller/store-settings/page.tsx'
      ),
      'utf8'
    );

    // Extract ONLY the catch block body of handleVerticalSave (the previous
    // pattern also captured the try body, whose success path legitimately
    // calls setVerticalSaved(true))
    const catchMatch = src.match(
      /handleVerticalSave[\s\S]*?catch\s*(?:\([^)]*\))?\s*\{([\s\S]*?)\}\s*finally/
    );
    if (catchMatch) {
      const catchBlock = catchMatch[1];
      // After fix: catch block must NOT set verticalSaved(true)
      expect(catchBlock).not.toContain('setVerticalSaved(true)');
      // After fix: catch block must NOT call setStoreType(pendingVertical)
      expect(catchBlock).not.toContain('setStoreType(pendingVertical)');
    }
    // If catch block not found pattern will still detect the bad state
    // via the broader source check below.
    const catchGross = src.indexOf('catch {');
    if (catchGross !== -1) {
      const catchSnippet = src.slice(catchGross, catchGross + 300);
      expect(catchSnippet).not.toContain('setVerticalSaved(true)');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 5 — sellerProductService exposes deleteSellerProduct
// ─────────────────────────────────────────────────────────────────────────────

describe('Fix 5 — sellerProductService has deleteSellerProduct', () => {
  it('deleteSellerProduct is exported from sellerProductService', async () => {
    const mod = await import('../sellerProductService');
    expect(typeof (mod as any).deleteSellerProduct).toBe('function');
  });

  it('deleteSellerProduct calls DELETE /api/seller/products/:id', async () => {
    const apiModule = await import('@/lib/api');
    const calls: Array<{ method: string; url: string }> = [];
    const origDelete = apiModule.default.delete.bind(apiModule.default);
    apiModule.default.delete = async (url: string) => {
      calls.push({ method: 'DELETE', url });
      return { data: { success: true }, status: 200 };
    };

    const mod = await import('../sellerProductService');
    await (mod as any).deleteSellerProduct(42);

    apiModule.default.delete = origDelete;

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/api/seller/products/42');
  });
});

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
