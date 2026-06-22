import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Storefront audit P1-E: the App Router had ZERO route-level loading.tsx files, so
 * hard navigations showed a blank shell until the client fetch resolved. These guard
 * that the high-traffic routes keep an instant Suspense skeleton, and that category
 * pages keep server-side metadata (they were near-invisible to crawlers before).
 */
const APP = path.join(process.cwd(), 'src/app');

describe('P1-E — route-level loading.tsx skeletons exist', () => {
  const routes = [
    'products/[id]/loading.tsx',
    'category/[slug]/loading.tsx',
    'products/loading.tsx',
    'cart/loading.tsx',
    'wishlist/loading.tsx',
    'orders/loading.tsx',
  ];

  it.each(routes)('%s exists, default-exports a *Loading component, animates', (rel) => {
    const p = path.join(APP, rel);
    expect(fs.existsSync(p)).toBe(true);
    const src = fs.readFileSync(p, 'utf8');
    expect(src).toMatch(/export default function \w*Loading\(/);
    expect(src).toContain('animate-pulse');
    // RTL-safe: skeletons must not use physical directional margins/paddings.
    expect(src).not.toMatch(/className="[^"]*\b(ml-|mr-|pl-|pr-)\d/);
  });
});

describe('P1-E — category pages get server-side metadata (SEO)', () => {
  it('category/[slug]/layout.tsx exports generateMetadata with canonical + OG', () => {
    const src = fs.readFileSync(path.join(APP, 'category/[slug]/layout.tsx'), 'utf8');
    expect(src).toMatch(/export async function generateMetadata/);
    expect(src).toContain('alternates');
    expect(src).toContain('openGraph');
    // Must fall back gracefully on fetch failure (never throw during metadata gen).
    expect(src).toContain('catch');
  });
});
