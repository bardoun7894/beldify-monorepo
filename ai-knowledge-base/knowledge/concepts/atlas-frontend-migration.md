---
name: Atlas Frontend Migration (Next.js)
description: Parallel agent fan-out methodology for migrating the Beldify Next.js storefront to Atlas design tokens — Phase 1 audit, Phase 2 chrome workers, Phase 3 page-cluster workers, Phase 4 QA triangulation, Phase 5 remaining screens + P0 palette fixes + PRs merged to main
type: concept
sources: [daily/2026-05-24.md, daily/2026-06-02.md]
created: 2026-05-24
updated: 2026-06-02
---

# Atlas Frontend Migration (Next.js)

## Overview
The Beldify Next.js frontend migration to the Atlas design system was executed via parallel agent fan-out across four phases on 2026-05-24. The methodology isolated each agent's file set (disjoint partitioning using git worktrees) to produce zero merge conflicts across up to 6 simultaneous workers. Phase 4 revealed execution gaps: 245 locale keys unpopulated, 30 `console.log` statements in production paths, 45 RTL leaks (`ml-`/`mr-` instead of `ms-`/`me-*`), and 35 `bg-primary` token substitutions still needed.

## Key Points
- **Phase 1**: Token audit — `globals.css` HSL/RGB token fix; `--primary: 243 75% 51%` (indigo-700); Playfair/Inter font vars established
- **Phase 2**: 3 chrome workers (Navbar + Footer, Navigation components, Hero + Promotions) — parallel via git worktrees
- **Phase 3**: 6 page-cluster workers — catalog, auth/profile, cart/checkout/orders, legal/content pages, sellers/shops, locale files
- **Phase 4**: QA + reviewer + dogfood triangulation — found execution gaps (workers claimed done but left work incomplete)
- **Disjoint partitioning**: each worker owns a file set with no overlap → zero merge conflicts
- **Phase 4 defects**: 245 missing locale keys, 30 `console.log` leaks, 45 RTL leaks, 35 `bg-primary` tokens

## Details

### Phase 1 — Token audit
`beldify-frontend/src/app/globals.css` was the baseline:
- HSL variables converted to exact RGB/HSL values matching DESIGN.md: `--primary: 243 75% 51%` maps to indigo-700 `#4338CA`
- Saffron amber accent: `--accent: 38 92% 50%` = amber-500 `#F59E0B`
- Typography vars: `--font-display: 'Playfair Display'`, `--font-body: 'Inter'`
- All `bg-primary` occurrences to audit: token exists in Tailwind config but the underlying hue was wrong before this phase

### Phase 2 — Chrome workers (3 parallel)
Each worker ran in an isolated git worktree:

| Worker | Files owned | Key changes |
|--------|------------|-------------|
| 2A — Navbar + Footer | `Navbar.tsx`, `Footer.tsx` | Atlas indigo top bar; Darija footer columns; locale key normalization |
| 2B — Navigation | `CategoryDropdown.tsx`, `BottomNavigation.tsx`, `MobileBottomNav.tsx`, `Breadcrumbs.tsx`, `TopCategoriesGrid.tsx` | Atlas token application; RTL logical properties |
| 2C — Hero + Promotions | `HeroSlider.tsx`, `MegaOffers.tsx`, `NewArrivals.tsx`, `PopularCategoriesSection.tsx`, `HomeShopByCategory.tsx` | Indigo/amber palette; Playfair display font; editorial Moroccan feel |

### Phase 3 — Page-cluster workers (6 parallel)
| Worker | Cluster | File count |
|--------|---------|-----------|
| 3A — Catalog | category, categories, products pages + filter/card components | ~8 files |
| 3B — Auth + Profile | login, register, forgot-password, profile, wishlist, returns pages + auth components | ~12 files |
| 3C — Cart + Commerce | cart, checkout, checkout/success, orders, orders/[id] + CartItem, CartSummary, MiniCart | ~10 files |
| 3D — Legal + Content | about, contact, faqs, privacy, terms, shipping, size-guide, services pages | ~9 files |
| 3E — Sellers/Shops | 15 seller/shop files | ~15 files |
| 3F — Locale files | all 5 locale files (en/fr/es/ar/ma.json) | 5 files, ~280 keys claimed |

### Phase 4 — QA + reviewer + dogfood triangulation
Three agents ran independently on the merged branch:
- **QA agent**: automated scan for console.logs, ml-/mr- usages, missing `t()` wrappers
- **Reviewer agent**: code quality, token consistency, spec compliance
- **Dogfood agent**: simulated user flows in browser — caught English fallbacks where workers claimed Darija/FR

**Defects found:**
| Defect | Count | Severity |
|--------|-------|---------|
| Missing locale keys (workers wrote EN strings inline without adding to JSON) | 245 | High — silent English fallbacks on non-EN locales |
| `console.log` statements in production paths (order data, cart state) | 30 | Medium — data exposure risk |
| RTL leaks: `ml-`, `mr-` instead of `ms-`, `me-` | 45 (in 16 files) | Medium — layout broken under `dir="rtl"` |
| Stale `bg-primary` tokens (wrong hue before Phase 1 fix, not updated by workers) | 35 | Low — cosmetic; incorrect shade |
| Checkout SyntaxError (stray `style={{...}}` from Phase 2/3C merge) | 1 | Critical — fixed manually before Phase 4 |

### Lessons from Phase 4 gap analysis
Workers completed structural token substitution correctly (indigo/amber palette, Playfair/Inter fonts) but execution gaps appeared at the boundaries of the declared scope:
1. **Locale key population**: workers added the `t()` call but not the corresponding JSON entry — the key silently falls back to the key string in production
2. **Console.log**: inherited from previous implementation; not in the explicit migration scope so workers left it
3. **RTL**: workers used physical Tailwind spacing classes from muscle memory; `ms-`/`me-` equivalents require conscious substitution

**Fix strategy for Phase 5 (not yet executed):**
- Run `grep -r 'console\.log' src/` → remove all 30
- Run `grep -r '\bml-\|\bmr-' src/` → replace with logical equivalents in 16 files
- Walk missing 245 keys: add to all 5 locale files, verify `t()` wrappers in components
- Replace 35 `bg-primary` occurrences with `bg-indigo-700` or `bg-[var(--primary)]`

---

## Phase 5 — Remaining screens via parallel worktree agents (2026-06-02)

### Scope
Screens not covered in Phase 2/3: PDP (`_9`), Cart (`_12`), Artisan shop (`_10`), Tailoring measurements (new route), Product listing (`_4`). Each agent ran in an isolated git worktree with disjoint file ownership.

| Worker | Files owned | Output |
|--------|------------|--------|
| wf_6feb1852 | `app/products/[id]/page.tsx` | PDP Atlas port |
| wf-7 | `app/cart/page.tsx` | Cart Atlas port |
| wf-8 | `app/shops/[name]/page.tsx` | Artisan shop Atlas port |
| wf-9 | `app/products/page.tsx`, `ProductCard.tsx`, `FilterChips.tsx` | Listing port |
| wf-10 | `app/services/tailoring/measurements/page.tsx` (new), `MeasurementForm.tsx` (new) | Tailoring measurements route |

### P0 palette fixes (post-merge)
After merging all worktrees, an automated scan found three categories of off-palette color usage:

| Issue | Files affected | Fix |
|-------|---------------|-----|
| `#6366f1` (Tailwind violet, NOT Atlas indigo) in 4 files | MeasurementForm, CartItem, FilterChips, ProductCard | `sed -i 's/#6366f1/#3b3b6d/g'` |
| Purple parchment gradient `#e2dfff`/`#c2c1fc` in MeasurementForm | 1 file | Replaced with parchment neutrals `#fbf9f4`/`#f3ede3` |
| `from-green-500 to-emerald-500` gradient in cart CTA | 1 file | Replaced with flat `bg-atlas-primary` |

Atlas indigo is `#252555` (deep navy) or `#3b3b6d` (mid-tone variant), **not** `#6366f1` (Tailwind's indigo-500). Workers must reference `DESIGN.md`, not Tailwind's named palette.

### Tailwind build failures discovered in Phase 5

Two distinct build-time errors surfaced and were diagnosed:

1. **CSS comment premature-close** — A `*/` substring inside a `globals.css` comment at line 190 terminated the comment block early, causing PostCSS to emit "Unexpected '/'". See [[concepts/tailwind-css-comment-premature-close]].

2. **Arbitrary-value internal slash** — Fix agent auto-generated `bg-[hsl(var(--primary)/0.1)]` (21 occurrences). The `/` inside the bracket is read as the Tailwind opacity-modifier separator. Fixed by registering `atlas-primary`/`atlas-secondary` alpha-aware tokens and using `bg-atlas-primary/[0.1]` syntax. See [[concepts/tailwind-arbitrary-value-slash-pitfall]].

Both errors were masked by the 55-assertion vitest suite (string-based checks that never invoke PostCSS). Actual detection required running `npx tailwindcss -i src/app/globals.css -o /tmp/tw.css` standalone.

### PRs and merge to main (2026-06-02)

| Repo | PR | Base branch | Notes |
|------|----|------------|-------|
| beldify-frontend | PR #1 | `001-api-alignment` (monorepo de-facto main; no `main` existed at merge time) | Merged; fast-forwarded to newly created `origin/main` |
| beldify-backend | PR #3 | `main` | Merged; bypassed pre-existing lint CI failure on unrelated admin Blade files |

The monorepo had no `main` branch; `001-api-alignment` was the integration branch. A new `origin/main` was created by fast-forwarding after the frontend PR merged.

## Related Concepts
- [[concepts/atlas-design-system]] — The design system being applied; indigo-700/amber-500 tokens
- [[concepts/admin-atlas-migration]] — Parallel backend admin migration; same Atlas tokens, different surface
- [[concepts/tailwind-jit-dynamic-class-pitfalls]] — RTL class construction pitfalls that showed up in Phase 4
- [[entities/nextjs]] — Framework hosting the migrated storefront
- [[entities/beldify]] — The platform whose customer-facing UI is being migrated

## Sources
- [[daily/2026-05-24.md]] — Full Phase 1-4 Atlas frontend migration; parallel agent fan-out with git worktree isolation; Phase 4 gap analysis revealing 245 locale key gaps, 30 console.log leaks, 45 RTL leaks; checkout SyntaxError fixed; Phase 5 remediation plan recorded
- [[daily/2026-06-02.md]] — Phase 5 execution (5 remaining screens via worktree agents); P0 palette fix sweep (`#6366f1`→`#3b3b6d`, purple→parchment, green gradient→indigo); CSS comment premature-close bug diagnosed + fixed; arbitrary-value slash build failure diagnosed + atlas-primary/atlas-secondary alpha tokens registered; frontend PR #1 → `001-api-alignment`, backend PR #3 → `main`, both merged and fast-forwarded to `origin/main`

## See also
- [[sources/gemini-2026-06-02-storefront-atlas-redesign-review]]
