#!/usr/bin/env node
/**
 * Presentation-polish verification for the Shops & Sellers screens.
 * Asserts the Atlas-token fixes are present and anti-slop / RTL bugs are gone.
 * Pure source-string assertions — no runtime, no backend.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const shopsPage = read('src/app/shops/page.tsx');
const sellersPage = read('src/app/sellers/page.tsx');
const shopDetail = read('src/app/shops/[name]/page.tsx');
const shopSort = read('src/components/shops/ShopSort.tsx');

let failures = 0;
const check = (name, cond) => {
  if (!cond) { failures++; console.error(`  FAIL: ${name}`); }
  else { console.log(`  ok: ${name}`); }
};

console.log('shops/page.tsx');
// P1: sticky search bar must sit under the 64px navbar, not collide at top-0
check('search bar uses sticky top-16 (under navbar)', /sticky top-16/.test(shopsPage));
check('search bar no longer sticky top-0', !/sticky top-0/.test(shopsPage));
// P3: skeleton heights via tokens, no inline magic numbers
check('skeleton has no inline style height', !/style=\{\{\s*height/.test(shopsPage));

console.log('sellers/page.tsx');
// P2: Saffron Amber token is amber-500, not amber-400
// base accent fills must be amber-500; hover:bg-amber-400 is the intended darker hover
check('no base bg-amber-400 fills (hover allowed)', !/(?<!hover:)bg-amber-400/.test(sellersPage));
check('uses bg-amber-500 accent', /bg-amber-500/.test(sellersPage));
check('no hover:bg-amber-300', !/hover:bg-amber-300/.test(sellersPage));

console.log('shops/[name]/page.tsx');
check('no base bg-amber-400 fills (hover allowed)', !/(?<!hover:)bg-amber-400/.test(shopDetail));
check('uses bg-amber-500 accent', /bg-amber-500/.test(shopDetail));
// tab strip stays at top-16 (correct — navbar pins at 64px)
check('tab strip sticky top-16', /sticky top-16/.test(shopDetail));
// P3: dead duplicate margin utility removed
check('no colliding mt-0.5 + mt-1.5 on bullet', !/mt-0\.5 h-2 w-2 rounded-full bg-amber-\d+ shrink-0 mt-1\.5/.test(shopDetail));
// P3: About paragraphs capped to comfortable measure
check('About paragraphs capped with max-w', /max-w-prose|max-w-\[65ch\]/.test(shopDetail));
// P2: no fabricated/static review cards rendered; honest empty state instead
// (The page no longer ships a STATIC_REVIEWS array — the previous assertion
// required it to be gated, but the correct state is for it to not exist at
// all, with a designed empty state when reviewsCount === 0.)
const hasFakeReviewMap = /STATIC_REVIEWS[\s\S]{0,400}\.map/.test(shopDetail);
const hasDesignedEmptyState =
  /Designed empty state/.test(shopDetail) && /shop\.no_reviews_title/.test(shopDetail);
check(
  'no fabricated reviews rendered; empty state present',
  !hasFakeReviewMap && hasDesignedEmptyState
);
// P2: sort <select> is functional (wired to state + onChange)
check('sort select is wired (value + onChange)', /<select[\s\S]{0,200}value=\{sortBy\}[\s\S]{0,200}onChange/.test(shopDetail));
// P2: no fabricated/non-mappable filter pills left (festival/new/sale removed)
check('no fabricated festival/new/sale pills', !/'festival'|'sale'|id: 'new'/.test(shopDetail));

console.log('ShopSort.tsx');
check('uses shadow-atlas tokens not shadow-sm/lg', /shadow-atlas/.test(shopSort) && !/shadow-sm|shadow-lg/.test(shopSort));
check('uses rounded-2xl not rounded-lg', /rounded-2xl/.test(shopSort) && !/rounded-lg/.test(shopSort));
check('no border-l-4 side-stripe (anti-slop + RTL bug)', !/border-l-4/.test(shopSort));

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nAll presentation-polish checks passed.');
