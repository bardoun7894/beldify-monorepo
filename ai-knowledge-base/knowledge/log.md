# Build Log

Append-only log of compile and ingest operations.

## [2026-05-08T19:10:00] ingest | raw/CLAUDE.md
- Source: raw/CLAUDE.md
- Source page: [[sources/beldify-claude]]
- Concepts created: [[concepts/monorepo]], [[concepts/dev-workflow]]
- Concepts updated: (none)
- Entities created: [[entities/beldify]], [[entities/nextjs]], [[entities/laravel]]
- Entities updated: (none)
- Contradictions with existing articles: none

## [2026-05-08T19:15:00] ingest | raw/backend-claude.md
- Source: raw/backend-claude.md
- Source page: [[sources/backend-claude]]
- Concepts created: [[concepts/service-repository-pattern]], [[concepts/api-versioning]], [[concepts/multi-seller-ecommerce]], [[concepts/caching-strategy]]
- Concepts updated: (none)
- Entities created: [[entities/mysql]], [[entities/redis]], [[entities/sanctum]], [[entities/fcm]]
- Entities updated: [[entities/laravel]] (added new source)
- Contradictions with existing articles: none

## [2026-05-15T00:00:00+01:00] compile | daily/2026-05-14.md
- Source: daily/2026-05-14.md
- Articles created: [[concepts/production-db-reset]], [[concepts/cloudflare-caching-issue]], [[concepts/atlas-design-system]], [[concepts/stitch-design-generation]], [[concepts/docker-deployment]], [[concepts/nextjs-image-config]], [[concepts/category-image-pipeline]], [[connections/design-system-and-deployment]]
- Articles updated: (none)
- Entities touched (read-only, no new entities created): [[entities/mysql]], [[entities/laravel]], [[entities/nextjs]], [[entities/beldify]], [[entities/fcm]]

## [2026-05-20T16:47:00+01:00] compile | daily/2026-05-20.md
- Source: daily/2026-05-20.md
- Articles created: (none — log contains only a wait-state monitoring session; no decisions, code changes, or technical discoveries to compile)
- Articles updated: (none)

## [2026-05-21T05:08:02+01:00] compile | daily/2026-05-21.md
- Source: daily/2026-05-21.md
- Articles created: (none — log contains only stub entries: a memory-maintenance session with placeholder text and a brief "admin layout cleanup" agent invocation with no recorded outcome; insufficient content to extract concepts)
- Articles updated: (none)
## [2026-05-21T06:00:00+01:00] compile | daily/2026-05-21.md
- Source: daily/2026-05-21.md
- Articles created: [[concepts/open-souk-feature]], [[concepts/admin-atlas-migration]], [[concepts/tailwind-jit-dynamic-class-pitfalls]], [[concepts/missing-views-git-restore]], [[concepts/admin-login-redirect-fix]]
- Articles updated: [[concepts/docker-deployment]] (OOM kill recovery + nginx reverse proxy topology), [[concepts/atlas-design-system]] (FeaturedSections re-tokenization + admin surface extension)
- Entities touched (read-only): [[entities/laravel]], [[entities/nextjs]], [[entities/beldify]]
- Contradictions with existing articles: none

## [2026-05-21T21:00:00+01:00] compile | daily/2026-05-21.md (session 1295f6ce — afternoon)
- Source: daily/2026-05-21.md (second session: MIME-type debugging + commissions packet)
- Articles created: [[concepts/admin-asset-url-misconfiguration]], [[concepts/admin-panel-migration-decision]]
- Articles updated: [[concepts/admin-atlas-migration]] (added afternoon session 1295f6ce work: commissions correctness, Vite unblock, community brand alignment, RTL CSS, ~405 KB CSS removal, Atlas fonts, CI lint guard), [[concepts/tailwind-jit-dynamic-class-pitfalls]] (added CI lint guard workflow + tw-ring-primary-* safelist fix)
- Entities touched (read-only): [[entities/laravel]], [[entities/beldify]]
- Contradictions with existing articles: none

## [2026-05-23T14:54:38+01:00] compile | daily/2026-05-23.md
- Source: daily/2026-05-23.md
- Articles created: [[concepts/php-opcache-deployment-pitfall]], [[concepts/docker-env-file-recreation]], [[concepts/css-accordion-max-height-pattern]], [[concepts/css-rtl-override-physical-properties]], [[concepts/beldify-admin-v3-sidebar]], [[concepts/beldify-admin-v3-component-library]]
- Articles updated: [[concepts/admin-atlas-migration]] (V3 sidebar + component library + 11 pages ported + 5 bugs fixed; new source daily/2026-05-23.md appended)
- Entities touched (read-only): [[entities/laravel]], [[entities/beldify]]
- Contradictions with existing articles: none

## [2026-05-23T17:00:00+01:00] compile | daily/2026-05-23.md (session 741f1260 — verification pass)
- Source: daily/2026-05-23.md (second session: /retro invocation, 2 turns, no output produced)
- Articles created: (none — session contained only a skill invocation with no assistant output; no decisions, code changes, or technical discoveries to compile)
- Articles updated: (none)
- Notes: Previous compile at 2026-05-23T14:54:38+01:00 already processed the main b0eb28fe session in full. All 6 articles and index entries verified present on disk.

## [2026-05-24T23:59:00+01:00] compile | daily/2026-05-24.md
- Source: daily/2026-05-24.md
- Articles created: [[concepts/sidebar-badge-service]], [[concepts/seller-shell-layout]], [[concepts/atlas-frontend-migration]]
- Articles updated: [[concepts/beldify-admin-v3-sidebar]] (indigo gradient restyle v8→v10, 50→17 item simplification, section label translations, Messages item, SidebarBadgeService wiring), [[concepts/admin-atlas-migration]] (catalog/tailoring/marketplace/community/commissions/store-requests ports; seller dashboard lean rewrite; seller_shell layout; seller experience specs 006; Next.js Atlas Phase 1-4; Phase 4 gap analysis), [[concepts/open-souk-feature]] (seller-side Freelancer-style browse/bid/track UX; seller shell integration; admin sidebar Community→Open Souk rename)
- Entities touched (read-only, no new entities created): [[entities/laravel]], [[entities/nextjs]], [[entities/redis]], [[entities/beldify]]
- Contradictions with existing articles: none

## [2026-05-24T15:46:21+01:00] compile | daily/2026-05-24.md (second pass — residual concepts)
- Source: daily/2026-05-24.md
- Articles created: [[concepts/laravel-optional-typehint-pitfall]], [[concepts/vitest-worktree-config-collision]], [[concepts/i18n-t-fallback-vs-locale-value]], [[concepts/seller-experience-specs-006]]
- Articles updated: [[concepts/beldify-admin-v3-component-library]] (added x-v3.search-input component spec; deployed to 11 table files; sources + updated date updated)
- Notes: First pass (2026-05-24T23:59:00+01:00) covered primary session articles. This pass captures residual concepts flagged in session summaries as KB candidates: optional() anti-pattern, Vitest worktree collision, i18n fallback misconception, seller spec suite.

## [2026-05-21T05:42:00+01:00] ingest | raw/sessions/2026-05-14-7f3c17d0.md
- Source: raw/sessions/2026-05-14-7f3c17d0.md
- Source page: [[sources/sessions-2026-05-14-7f3c17d0]]
- Concepts created: [[concepts/seeder-fk-pre-resolution]], [[concepts/docker-bind-mount-over-rebuild]]
- Concepts updated: (none — existing atlas-design-system and stitch-design-generation pages already cover the Stitch homepage live confirmation from their own daily/2026-05-14 sourcing)
- Entities created: (none)
- Entities updated: (none — fcm entity not updated; the session's FCM env-var requirements are noted in the source page itself)
- Contradictions with existing articles: none

## [2026-05-25T00:00:00+01:00] compile | daily/2026-05-24.md (third pass — infra and tooling concepts)
- Source: daily/2026-05-24.md
- Articles created: [[concepts/sqlite-migration-driver-guard]], [[concepts/git-orphaned-gitlink-fix]], [[concepts/nextjs-i18n-lint]]
- Articles updated: (none — all other concepts from this session already captured in first and second pass)
- Notes: Third pass targets three infra/tooling concepts from the Atlas frontend migration QA that were not captured in earlier passes: SQLite driver-aware migration guard (17 migrations patched, 0→12 tests unblocked), orphaned gitlink fix (beldify-frontend/ mode-160000 with no .gitmodules, commit 9c143d6), and i18n-lint.mjs static analyser (271→78 baseline, JS array false-negative gap, 245 missing locale key finding).

## [2026-06-01T23:59:00+01:00] compile | daily/2026-06-01.md
- Source: daily/2026-06-01.md (session 25023e79 — store-profile crash, no-store gating, JS scope fix, seller 403, messaging contract fix)
- Articles created:
  - [[concepts/laravel-route-model-binding-null-param]]
  - [[concepts/seller-no-store-gating]]
  - [[concepts/seller-js-layout-scope]]
  - [[concepts/buyer-seller-messaging-contract-fix]]
- Articles updated:
  - [[concepts/beldify-local-volume-sync]] — added note: sync-local.sh does NOT sync app/ or routes/ PHP; docker cp + restart required for middleware/route changes
  - [[concepts/seller-shell-layout]] — JS scope fix (seller-dashboard.js moved to shell); topbar avatar + sidebar profile link 403 fix (admin route → seller route)
- Entities touched (read-only, no new entities created): [[entities/laravel]], [[entities/nextjs]], [[entities/beldify]]
- Contradictions with existing articles: none

## [2026-06-01T01:00:00+01:00] compile | daily/2026-05-29.md
- Source: daily/2026-05-29.md (two sessions: local Docker mirror setup + admin community i18n/UI polish)
- Articles created: [[concepts/macos-docker-case-sensitivity-pitfall]], [[concepts/docker-local-production-mirror]], [[concepts/laravel-user-display-name-accessor]]
- Articles updated: [[concepts/admin-atlas-migration]] (2026-05-29 session block: community pages i18n, Quick Actions CSS fix, Storage::url null guard, display_name accessor, 8 correctness bug fixes, local Docker mirror, 342-file commit), [[concepts/tailwind-jit-dynamic-class-pitfalls]] (admin CSS bundle context variant: admin loads PixInvent CSS not Vite build; scoped inline style fix pattern)
- Entities touched (read-only, no new entities created): [[entities/laravel]], [[entities/beldify]]
- Contradictions with existing articles: none

## [2026-06-01T23:59:00+01:00] compile | daily/2026-05-31.md
- Source: daily/2026-05-31.md
- Sessions compiled: 0c1b54c6 (backend variants+admin product unification), b750bbe2 (dual-mode dashboard design), 4c0ae9be (Stitch prompts + skill creation), c623c86f (seller dashboard light polish), 48de5834 (impeccable admin+seller)
- Articles created:
  - [[concepts/variant-write-service]]
  - [[concepts/options-matrix-variant-builder]]
  - [[concepts/dual-mode-seller-dashboard]]
  - [[concepts/beldify-local-volume-sync]]
  - [[concepts/line-awesome-cdn-version-fix]]
  - [[concepts/beldify-ecommerce-ui-skill]]
  - [[concepts/admin-dashboard-atlas-polish]]
- Articles updated:
  - [[concepts/admin-atlas-migration]] — 2026-05-31 work: impeccable pass, VariantWriteService, options-matrix builder, dual-mode dashboard, unified admin product page, blank seller icons (LA CDN), community/show ParseError
- Key findings from this log:
  - product_variants.attributes column was missing from all migrations — deploy-blocking for production
  - Blank seller icons root cause: Line Awesome 1.1.0 CDN dead → upgraded to 1.3.0
  - Local :7895 stack uses named volume not bind mount — sync-local.sh + docker restart required for lang file changes
  - New Tailwind utility classes invisible until sync-local.sh rebuilds tailwind.css
  - Leaking messages.* placeholder keys: form components already call __() internally — missing keys in lang files, not missing wrappers
  - Blade ParseError in community/show: unclosed @if($sellerResponse) at line 35
  - current_purchase_unit_price NOT NULL column missing from seller ProductController store payload after VariantWriteService refactor

## [2026-06-01T00:00:00+01:00] compile | daily/2026-05-28.md
- Source: daily/2026-05-28.md (session 6d18f0a6 — full admin Atlas wiring + mass refactor day)
- Articles created: [[concepts/laravel-static-service-anti-pattern]], [[concepts/css-has-selector-body-class-hook]], [[concepts/pixinvent-rtl-data-textdirection]], [[concepts/prod-local-git-drift]], [[concepts/laravel-blade-route-guard-pattern]]
- Articles updated: [[concepts/admin-atlas-migration]] (2026-05-28 session block: static service fix, V3 wiring, Atlas body skin, data-textdirection RTL, 128-page wave refactor, Api/API fix, tailoring schema fix, route guard sweep, storage perms, git drift), [[concepts/beldify-admin-v3-sidebar]] (wiring fix story, body.bdv3-shell isolation strategy, data-textdirection RTL correction), [[concepts/beldify-admin-v3-component-library]] (Wave 1/2/3 mass refactor, 128 pages total), [[concepts/css-rtl-override-physical-properties]] (data-textdirection discovery, cross-reference to new article)
- Entities touched (read-only, no new entities created): [[entities/laravel]], [[entities/beldify]]
- Contradictions with existing articles: none

## [2026-06-02T23:59:00+01:00] compile | daily/2026-06-02.md
- Source: daily/2026-06-02.md (session bdb93bad — Atlas storefront port + seller dashboard Stitch IA + PRs merged)
- Articles created:
  - [[concepts/tailwind-css-comment-premature-close]] — `*/` substring inside CSS comment terminates block early; PostCSS "Unexpected '/'" build failure; diagnose with `npx tailwindcss` standalone; masked by vitest string tests
  - [[concepts/tailwind-arbitrary-value-slash-pitfall]] — `bg-[hsl(var(--token)/0.NN)]` fails JIT (/ = opacity-modifier); fix: register alpha-aware `atlas-primary`/`atlas-secondary` tokens with `<alpha-value>` in tailwind.config.js
- Articles updated:
  - [[concepts/atlas-frontend-migration]] — Phase 5 (5 remaining screens: PDP, Cart, Artisan Shop, Listing, Tailoring Measurements) via parallel worktree agents; P0 palette fix sweep (`#6366f1`→`#3b3b6d`, purple gradient→parchment, green cart→flat indigo); CSS comment + arbitrary-value build failures; frontend PR #1 → `001-api-alignment`, backend PR #3 → `main`, fast-forwarded to new `origin/main`
  - [[concepts/beldify-ecommerce-ui-skill]] — First real execution (7 surfaces); CSS build pitfalls documented; seller dashboard Stitch IA port (نظرة عامة H1, 3-up KPI, orders table, chart, duplicate section removed); IBM Plex Sans Arabic in seller_shell; sync-local.sh from-wrong-dir error confirmed
- Entities touched (read-only, no new entities created): [[entities/laravel]], [[entities/nextjs]], [[entities/beldify]]
- Contradictions with existing articles: none
- Key findings:
  - `npx tailwindcss -i src/app/globals.css -o /tmp/tw.css` is the canonical CSS build verifier — vitest string tests cannot detect PostCSS/JIT failures
  - Atlas indigo = `#252555`/`#3b3b6d`; Tailwind's `indigo-500` = `#6366f1` — they are different; workers must always reference DESIGN.md
  - sync-local.sh must run from monorepo root (`/Users/mohamedbardouni/projects/beldify`), never from inside `beldify-backend/`
  - Monorepo had no `main` branch; `001-api-alignment` was the integration branch; `origin/main` created by fast-forward post-merge

## [2026-06-03T19:46:10+0100] ingest | raw/gemini/2026-06-02-storefront-atlas-redesign-review.md
- Source: raw/gemini/2026-06-02-storefront-atlas-redesign-review.md
- Source page: [[sources/gemini-2026-06-02-storefront-atlas-redesign-review]]
- Concepts updated: [[concepts/atlas-design-system]], [[concepts/atlas-frontend-migration]]
- Contradictions: none (rejected indigo-500 finding aligns with existing KB that #6366f1 ≠ Atlas Indigo)

## [2026-06-03T19:46:10+0100] ingest | raw/gemini/2026-06-02-storefront-pages-drift-sweep.txt
- Source: raw/gemini/2026-06-02-storefront-pages-drift-sweep.txt
- Source page: [[sources/gemini-2026-06-02-storefront-pages-drift-sweep]]
- Concepts updated: [[concepts/atlas-design-system]], [[concepts/tailwind-jit-dynamic-class-pitfalls]]
- Contradictions: none

## [2026-06-03T19:46:10+0100] ingest | raw/panel/2026-05-30-product-mgmt-backend.md
- Source: raw/panel/2026-05-30-product-mgmt-backend.md
- Source page: [[sources/panel-2026-05-30-product-mgmt-backend]]
- Concepts updated: [[concepts/variant-write-service]], [[concepts/options-matrix-variant-builder]]
- Contradictions: none

## [2026-06-03T19:46:10+0100] ingest | raw/panel/2026-05-21-admin-css-js-conflicts.md
- Source: raw/panel/2026-05-21-admin-css-js-conflicts.md
- Source page: [[sources/panel-2026-05-21-admin-css-js-conflicts]]
- Concepts updated: [[concepts/admin-panel-migration-decision]], [[concepts/admin-atlas-migration]]
- Contradictions: none

## [2026-06-03T19:46:10+0100] ingest | raw/gemini/2026-05-31-seller-dual-mode-reference-apply.md
- Source: raw/gemini/2026-05-31-seller-dual-mode-reference-apply.md
- Source page: [[sources/gemini-2026-05-31-seller-dual-mode-reference-apply]]
- Concepts updated: [[concepts/dual-mode-seller-dashboard]]
- Contradictions: none
