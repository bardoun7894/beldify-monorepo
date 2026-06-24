/**
 * TDD RED→GREEN — robots.ts and sitemap.ts exist and have correct structure.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const robotsSrc = readFileSync(join(__dirname, '../robots.ts'), 'utf-8');
const sitemapSrc = readFileSync(join(__dirname, '../sitemap.ts'), 'utf-8');

describe('robots.ts', () => {
  it('exports a default function', () => {
    expect(robotsSrc).toMatch(/export default function robots/);
  });

  it('allows all user agents', () => {
    expect(robotsSrc).toContain("userAgent: '*'");
    expect(robotsSrc).toContain("allow: '/'");
  });

  it('references the sitemap', () => {
    expect(robotsSrc).toContain('sitemap');
    expect(robotsSrc).toContain('sitemap.xml');
  });
});

describe('sitemap.ts', () => {
  it('exports a default async function', () => {
    expect(sitemapSrc).toMatch(/export default async function sitemap/);
  });

  it('includes static routes for home, products, categories', () => {
    expect(sitemapSrc).toContain('/products');
    expect(sitemapSrc).toContain('/categories/jewelry');
  });

  it('wraps API calls in try/catch for resilience', () => {
    // Should have at least two try/catch blocks (categories + products)
    const tryCatches = (sitemapSrc.match(/\btry\b/g) || []).length;
    expect(tryCatches).toBeGreaterThanOrEqual(2);
  });

  it('uses daily revalidation', () => {
    expect(sitemapSrc).toContain('revalidate: 86400');
  });
});
