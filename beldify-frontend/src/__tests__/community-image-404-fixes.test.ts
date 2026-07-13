import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Regression guards for the community API 404 + image 404 production errors.
 *
 * All tests follow the repo's source-reading convention (readFileSync) so
 * they run without jsdom and are CI-stable.
 */
const SRC = join(__dirname, '..');

const read = (rel: string) => readFileSync(join(SRC, rel), 'utf-8');

// ─── Part A: communityService baseURL + CSRF ────────────────────────────────

describe('communityService — baseURL must point to /api (same-origin proxy)', () => {
  const svc = read('services/communityService.ts');

  it('axiosInstance uses /api as baseURL, not /api/v1', () => {
    // Must have baseURL: LOCAL_API_BASE (which is '/api')
    // or baseURL: '/api' directly, and NOT baseURL: API_V1_URL
    expect(svc).toMatch(/baseURL:\s*LOCAL_API_BASE/);
    expect(svc).not.toMatch(/baseURL:\s*API_V1_URL/);
  });

  it('LOCAL_API_BASE is defined as /api', () => {
    expect(svc).toMatch(/LOCAL_API_BASE\s*=\s*['"]\/api['"]/);
  });

  it('getCsrfToken does not make a cross-origin call to API_BASE_URL', () => {
    // Must not reference API_BASE_URL in the CSRF fetch
    expect(svc).not.toMatch(/\$\{API_BASE_URL\}\/csrf-cookie/);
  });

  it('getCsrfToken uses same-origin path /api/csrf-token', () => {
    expect(svc).toContain('/api/csrf-token');
  });
});

describe('communityService — updateCommunityPost must use PUT, not POST+_method', () => {
  const svc = read('services/communityService.ts');

  it('updateCommunityPost calls axiosInstance.put, not axiosInstance.post', () => {
    // The function should call axiosInstance.put for the update
    expect(svc).toMatch(/axiosInstance\.put.*community\/posts\/\$\{id\}/);
  });

  it('updateCommunityPost does not append _method:PUT to FormData', () => {
    // _method spoofing should be removed since the Next route handler
    // exports PUT, not POST
    expect(svc).not.toContain("formData.append('_method', 'PUT')");
  });
});

// ─── Part B: Category image filenames ───────────────────────────────────────

describe('about/page.tsx — category images use slug-suffixed filenames', () => {
  const page = read('app/about/page.tsx');

  it('no longer references category_7.jpg (short, slug-less)', () => {
    expect(page).not.toContain('category_7.jpg');
  });

  it('no longer references category_14.jpg', () => {
    expect(page).not.toContain('category_14.jpg');
  });

  it('no longer references category_4.jpg', () => {
    expect(page).not.toContain('category_4.jpg');
  });

  it('no longer references category_8.jpg', () => {
    expect(page).not.toContain('category_8.jpg');
  });

  it('uses category_7_jabador.png', () => {
    expect(page).toContain('category_7_jabador.png');
  });

  it('uses category_14_wedding-dresses.png', () => {
    expect(page).toContain('category_14_wedding-dresses.png');
  });

  it('uses category_4_caftan.png', () => {
    expect(page).toContain('category_4_caftan.png');
  });

  it('uses category_8_mens-kandora.png', () => {
    expect(page).toContain('category_8_mens-kandora.png');
  });
});

describe('services/tailoring/page.tsx — category images use slug-suffixed filenames', () => {
  const page = read('app/services/tailoring/page.tsx');

  it('no longer references category_7.jpg', () => {
    expect(page).not.toContain('category_7.jpg');
  });

  it('no longer references category_8.jpg', () => {
    expect(page).not.toContain('category_8.jpg');
  });

  it('no longer references category_14.jpg', () => {
    expect(page).not.toContain('category_14.jpg');
  });

  it('no longer references category_4.jpg', () => {
    expect(page).not.toContain('category_4.jpg');
  });

  it('uses category_7_jabador.png', () => {
    expect(page).toContain('category_7_jabador.png');
  });

  it('uses category_8_mens-kandora.png', () => {
    expect(page).toContain('category_8_mens-kandora.png');
  });

  it('uses category_14_wedding-dresses.png', () => {
    expect(page).toContain('category_14_wedding-dresses.png');
  });

  it('uses category_4_caftan.png', () => {
    expect(page).toContain('category_4_caftan.png');
  });
});

// REMOVED: the block that asserted shops/[name]/page.tsx CONTAINS the four
// category_*.png stock images. Those were rendered with alt="Atelier interior" on
// every shop page — stock catalogue art presented as photos of that seller's own
// workshop. This test was *pinning the fabrication in place*: deleting the mock
// data broke the suite, so nobody deleted it. The shop page now derives that grid
// from the shop's real product photos and renders nothing when it has none.
// Enforced by src/app/shops/[name]/__tests__/NoFakeAtelierImages.test.ts.
//
// The about/, services/tailoring/ and HomeContent blocks above are LEGITIMATE:
// category artwork on a marketing page is not a claim about anyone's business.

describe('HomeContent.tsx — category images use slug-suffixed filenames', () => {
  const content = read('components/home/HomeContent.tsx');

  it('no longer references category_7.jpg', () => {
    expect(content).not.toContain('category_7.jpg');
  });

  it('no longer references category_14.jpg', () => {
    expect(content).not.toContain('category_14.jpg');
  });

  it('no longer references category_4.jpg', () => {
    expect(content).not.toContain('category_4.jpg');
  });

  it('no longer references category_5.jpg', () => {
    expect(content).not.toContain('category_5.jpg');
  });

  it('uses category_7_jabador.png', () => {
    expect(content).toContain('category_7_jabador.png');
  });

  it('uses category_14_wedding-dresses.png', () => {
    expect(content).toContain('category_14_wedding-dresses.png');
  });

  it('uses category_4_caftan.png', () => {
    expect(content).toContain('category_4_caftan.png');
  });

  it('uses category_5_womens-djellaba.png', () => {
    expect(content).toContain('category_5_womens-djellaba.png');
  });
});
