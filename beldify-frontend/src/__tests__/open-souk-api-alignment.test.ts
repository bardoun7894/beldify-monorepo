/**
 * Open Souk API-alignment tests
 *
 * Validates the new types, service method signatures, and proxy routes
 * added for the Open Souk feature (delivery_days, proposal_count,
 * has_my_proposal, buyer mini-profile, SellerCommunityStats, JobFilters,
 * JobSort, getSellerStats, extended fetchCommunityPosts params, and the
 * sellers/[shopId]/stats proxy route).
 *
 * Strategy: static `readFileSync`+`toContain` assertions for types/routes
 * (matching the project's established pattern), plus a lightweight
 * `vi.mock` test for the `getSellerStats` snake→UI mapping.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 1 — types/community.ts structural assertions
// ──────────────────────────────────────────────────────────────────────────────
describe('types/community.ts — new Open Souk fields', () => {
  const types = read('src/types/community.ts');

  // CommunityResponse: delivery_days / deliveryDays
  it('CommunityResponse has delivery_days field', () => {
    expect(types).toContain('delivery_days');
  });

  it('CommunityResponse has deliveryDays field', () => {
    expect(types).toContain('deliveryDays');
  });

  // CommunityPost: proposal_count / proposalCount
  it('CommunityPost has proposal_count field', () => {
    expect(types).toContain('proposal_count');
  });

  it('CommunityPost has proposalCount field', () => {
    expect(types).toContain('proposalCount');
  });

  // CommunityPost: has_my_proposal / hasMyProposal
  it('CommunityPost has has_my_proposal field', () => {
    expect(types).toContain('has_my_proposal');
  });

  it('CommunityPost has hasMyProposal field', () => {
    expect(types).toContain('hasMyProposal');
  });

  // CommunityPost: buyer mini-profile
  it('CommunityPost has buyer mini-profile field', () => {
    expect(types).toContain('buyer?:');
  });

  // CommunityResponseFormData: delivery_days
  it('CommunityResponseFormData has delivery_days field', () => {
    expect(types).toContain('delivery_days');
  });

  // SellerCommunityStats interface
  it('exports SellerCommunityStats interface', () => {
    expect(types).toContain('SellerCommunityStats');
  });

  it('SellerCommunityStats has avg_rating', () => {
    expect(types).toContain('avg_rating');
  });

  it('SellerCommunityStats has completed_jobs', () => {
    expect(types).toContain('completed_jobs');
  });

  it('SellerCommunityStats has total_proposals', () => {
    expect(types).toContain('total_proposals');
  });

  it('SellerCommunityStats has response_rate', () => {
    expect(types).toContain('response_rate');
  });

  it('SellerCommunityStats has member_since', () => {
    expect(types).toContain('member_since');
  });

  // JobFilters type
  it('exports JobFilters type', () => {
    expect(types).toContain('JobFilters');
  });

  it('JobFilters has budget_min', () => {
    expect(types).toContain('budget_min');
  });

  it('JobFilters has budget_max', () => {
    expect(types).toContain('budget_max');
  });

  it('JobFilters has skills', () => {
    expect(types).toContain('skills');
  });

  it('JobFilters has q (search query)', () => {
    expect(types).toContain('q?:');
  });

  // JobSort type
  it('exports JobSort type', () => {
    expect(types).toContain('JobSort');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 2 — communityService.ts structural assertions
// ──────────────────────────────────────────────────────────────────────────────
describe('communityService.ts — new service methods and params', () => {
  const service = read('src/services/communityService.ts');

  // fetchCommunityPosts must forward new filter params
  it('fetchCommunityPosts forwards budget_min', () => {
    expect(service).toContain('budget_min');
  });

  it('fetchCommunityPosts forwards budget_max', () => {
    expect(service).toContain('budget_max');
  });

  it('fetchCommunityPosts forwards skills', () => {
    expect(service).toContain('skills');
  });

  it('fetchCommunityPosts forwards q (full-text search)', () => {
    expect(service).toContain("'q'");
  });

  it('fetchCommunityPosts forwards sort', () => {
    expect(service).toContain('sort');
  });

  it('fetchCommunityPosts forwards limit', () => {
    expect(service).toContain('limit');
  });

  // submitProposal / createCommunityResponse must include delivery_days
  it('createCommunityResponse appends delivery_days to form data', () => {
    expect(service).toContain('delivery_days');
  });

  // getSellerStats exported function
  it('exports getSellerStats function', () => {
    expect(service).toContain('getSellerStats');
  });

  it('getSellerStats calls the correct API endpoint', () => {
    expect(service).toContain('/community/sellers/');
    expect(service).toContain('/stats');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 3 — proxy route for sellers stats
// ──────────────────────────────────────────────────────────────────────────────
describe('API proxy — sellers/[shopId]/stats/route.ts', () => {
  it('sellers stats proxy route file exists', () => {
    expect(
      exists('src/app/api/community/sellers/[shopId]/stats/route.ts')
    ).toBe(true);
  });

  it('sellers stats proxy GETs the correct backend endpoint', () => {
    const route = read('src/app/api/community/sellers/[shopId]/stats/route.ts');
    expect(route).toContain('/community/sellers/');
    expect(route).toContain('/stats');
  });

  it('sellers stats proxy is public (no mandatory auth guard)', () => {
    const route = read('src/app/api/community/sellers/[shopId]/stats/route.ts');
    // Must NOT return 401 when there is no auth token
    expect(route).not.toMatch(/if\s*\(!authToken\)[\s\S]{0,100}401/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 4 — posts route.ts forwards new query params
// ──────────────────────────────────────────────────────────────────────────────
describe('API proxy — posts/route.ts forwards new params', () => {
  const postsRoute = read('src/app/api/community/posts/route.ts');

  it('posts proxy forwards budget_min', () => {
    expect(postsRoute).toContain('budget_min');
  });

  it('posts proxy forwards budget_max', () => {
    expect(postsRoute).toContain('budget_max');
  });

  it('posts proxy forwards skills', () => {
    expect(postsRoute).toContain('skills');
  });

  it('posts proxy forwards q', () => {
    expect(postsRoute).toContain("'q'");
  });

  it('posts proxy forwards sort', () => {
    expect(postsRoute).toContain('sort');
  });

  it('posts proxy forwards limit', () => {
    expect(postsRoute).toContain('limit');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 5 — getSellerStats snake→UI mapping (behavioural)
// ──────────────────────────────────────────────────────────────────────────────
describe('getSellerStats — snake_case response mapped correctly', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('maps snake_case API response to SellerCommunityStats shape', async () => {
    // Mock axios to return a snake_case stats payload
    vi.doMock('axios', () => {
      const mockAxios: any = {
        create: () => mockAxios,
        get: vi.fn().mockResolvedValue({
          data: {
            success: true,
            data: {
              avg_rating: 4.7,
              completed_jobs: 12,
              total_proposals: 30,
              response_rate: 80,
              member_since: '2023-01-15',
            },
          },
        }),
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };
      return { default: mockAxios, ...mockAxios };
    });

    vi.doMock('@/config/constants', () => ({
      API_BASE_URL: 'http://localhost',
      API_URL: 'http://localhost',
    }));

    vi.doMock('@/utils/consoleLogger', () => ({
      default: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
    }));

    const { getSellerStats } = await import('../services/communityService');
    const stats = await getSellerStats('42');

    expect(stats.avg_rating).toBe(4.7);
    expect(stats.completed_jobs).toBe(12);
    expect(stats.total_proposals).toBe(30);
    expect(stats.response_rate).toBe(80);
    expect(stats.member_since).toBe('2023-01-15');
  });
});
