# Admin audit + sellers-on-prod + jewelry + full deploy — 2026-06-10 evening

Session scope (user): "check admin, fix all issues or gaps, also sellers in server, check stocks + jewelry section in stock, fix all admin dashboard incl. accounting, check controllers and views, deploy all changes to production."

## Deployed

Backend `main` = `a2f0f90b`, deployed to MyContabo via **git-archive-over-ssh** (`git archive main -- <files> | ssh tar -x -C <tree>`) — ships exactly committed content, immune to dirty-tree and rsync symlink-kill hazards. 37 files + `hero_settings` migration. composer dump-autoload (38,776 classes), view/route/cache clear, container restart, storage:link verified, storage chown. All smokes 200; `/api/hero-config` → `{"mode":"brand","banners":[]}` — the hero admin switch ([[concepts/hero-admin-switch]]) is now fully live end-to-end (FE shipped earlier as build #7).

## Fix packets (3 parallel backend-engineer agents + opus ACCT)

1. **SELLER `a0de0843`** — `hasMyProposal` as per-request overlay OUTSIDE CacheService::remember (cache-poison rule held, [[concepts/open-souk-feature]]); `ProposalAcceptedNotification` to both parties with messages deep links (closes accepted-proposal dead-end minimally); sellerStats `avg_rating` computed from CommunityInteractionReview (was always null). 51 tests. Already-fixed (KB was stale): stock-update redirect, no-store CTA loop, /seller/messages registration, mobile API routes (registered at api.php:609), store-settings PUT.
2. **ADMIN `3df136b7`** — wired missing `admin.variants.{index,create,store,edit,update,destroy}` under admin/stocks/{stock_id}/variants + `admin.marketplace.stores.show` (new MarketplaceController::showStore); null-safe stores/show view (type?->, owner guard, display_name initials — users have no name column); AdminPagesSweepTest: 17 assertions across dashboard/orders/stocks/storeProfiles/users/banners/coupons/configuration/returns/marketplace; `view:cache` compiles clean.
3. **ACCT `a2f0f90b`** — R10 CLOSED: canonical morph = `App\Models\Store::class` (store+platform) / `User::class` (affiliate); the WRITER (OrderObserver) was always canonical — the READER (CommissionController::summary) was wrong AND read the dead `commission_transactions` table; aligned to live `commissions` table. No data-fix migration needed. Flat-fee double-count fixed (commission_amount already includes flat fee). **P0: duplicate OrderObserver registration removed from EventServiceProvider (AppServiceProvider is sole site) — observer fired twice → double commissions/revenue.** Two-model verdict: `Commission` = authoritative live record, `CommissionTransaction` = accounting/settlement model; documented in backend docs/architecture/commission-system.md. 48 tests / 170 assertions.

## Prod data fixes (sellers + jewelry)

- **Jewelry category (id 20) was EMPTY** → seeded 6 stocks (ids 13–18: Berber silver necklace, fibula brooch, khmissa pendant, Fes filigree earrings, silver cuff, coral & pearl necklace), EN+AR, MAD prices, in_stock qty 25, product_images with unsplash URLs **verified 200 before insert** (anti dead-image). Mirrored to local DB (ids 27–32, after local `migrate`). SQL kept at server `/root/beldify-recovery-20260610/beldify-jewelry-seed.sql`.
- **fatima@example.com (user 2, owns store 1) had NO role** → `store_owner` granted (was locked out of seller dashboard).
- **admin@beldify.com (user 5) had only legacy `super_admin`** → canonical `super-admin` added (gates check the hyphen spelling). Both fixed via INSERT IGNORE + `permission:cache-reset`.
- Backlog: store 2 orphan (user_id NULL, pending), `store_profiles` = 0 rows (no seller completed onboarding).

## Architecture clarifications (important — prevents future false alarms)

- **The catalog lives in the `stocks` table, NOT `products`.** `products` (migration 2024_03_15) is a legacy ERP table, empty everywhere (prod + local). 12 prod items all in stocks, in_stock. Chasing "products table is empty" cost ~30 min of incident forensics.
- **Prod API routes are Host-scoped** — smoke tests against localhost:7894 MUST send `Host: pro.beldify.com` or every /api/* 404s (HTML 404 while /admin still 301s — looks exactly like a routing outage).
- k3s ingress map: www/beldify.com → frontend (4987), pro/api.beldify.com → backend nginx (7894); Cloudflare in front caches API max-age=300.
- Redis: `redis` alias = beldify-redis, AUTH required (`REDIS_PASSWORD` in backend env); Laravel cache in **db1** (db0 = sessions/etc). Keys like `laravel_database_laravel_cache:laravel_cache:product_details:{id}`.
- mysqlbinlog binary is NOT present in the beldify-mysql (mysql:8.0) container — binlog forensics needs an external image.

## Ops hardening

- **Prod had NO database backups.** Added: nightly 03:30 cron `mysqldump --single-transaction --routines beldify | gzip` → `/root/db-backups/`, 7-day retention; baseline dump taken (beldify-2026-06-10-1918.sql.gz).

## Incident: concurrent-session branch rewind

While ff-merging feat/hero-admin-switch → main, a concurrent session rewound the branch to 9e5d4908 (extracting its credits commit a14ab830), orphaning the 3 packet commits mid-operation. Recovered via cherry-pick (new SHAs a0de0843/3df136b7/a2f0f90b), branch + main re-pushed. Lesson: with 2+ live sessions in one nested repo, capture commit SHAs immediately after workers land and treat refs as volatile ([[concepts/parallel-agents-shared-tree-stash-hazard]] extended to ref rewinds).

## Scheduler inventory (ACCT packet, reported not invented)

Scheduled: `carts:process-abandoned` (hourly 09–21), `wishlist:send-notifications` (daily 10:00 — covers price-drop + back-in-stock). No Artisan command exists for: flash sales (no service code at all), coupon expiry (validation-time only), commission settlement (manual web CRUD via CommissionBatchController only) — escalation candidates.

## Open / blocked

- SMTP auth 535 (bardouni@beldify.com) — ALL prod email still dead, blocked on user password fix; then `queue:retry all`.
- Pre-existing test debt: CommunityApiTest 8 failures (old contract), SellerSsoBridgeTest 4 (route 404).
- `view_seller_community` permission gates `/seller/messages` (semantic smell, no lockout).
- backend `.env` git-tracked (15.8k lines, secrets) — untrack + scrub decision pending.
- Catalog content thin: only categories 4/5/8/20 have products; 14 leaf categories empty.

## Addendum 21:30 — Admin UI sweep + Bootstrap/Tailwind conflict verdict

**Conflict audit (user ask)**: NO live Bootstrap/Tailwind collisions. The admin coexists by design: Tailwind built with `prefix: 'tw-'` (+ DaisyUI `daisy-`), 269 admin views use tw- classes, PixInvent Bootstrap keeps its semantics (.collapse etc. unbroken — computed-style checks clean across 34 rendered pages). Static debt documented: Bootstrap 5.3 loaded TWICE (vite bundle + 341KB public/css/app.css copy) + Tailwind twice, preflight mid-cascade — ~450KB dead CSS per admin page, dedup deferred (24 files use BS5-only utilities like ms-/me- that lean on those layers). Plus ~24 files with BARE (unprefixed → dead) Tailwind classes — fix packet running (bare→tw-).

**46-route visual sweep findings (local mirror)** — 13 distinct real bugs, top: static call to non-static StorageService::getUrl() 500s ~7 admin views (stocks details, inventory, fabrics, stores show, carts show); i18n raw-key epidemic ~12 pages (reviews/shipping/orders-settings worst); `$().DataTable is not a function` kills tables on orders/stocks/users/categories/carts; Admin\OrderController::pending missing (web.php:206); locale-prefixed route-name bug in product-images upload-form; accounting web routes 501 + sidebar Accounting → raw JSON; financeYears empty table + "Add branch" CTA; banners duplicate zero-stats + feather undefined; Chart.js double-init; 401 message-poller every page; PWA install modal blocks admin; title "Laravel"; /ar admin lacks dir="rtl", "$" not MAD. 8 further 500s were CONTAINER DRIFT only (local mirror stale: coupons, returns, marketplace show, payment/sms/ai settings, balance-sheet, commission_transactions) — repo/prod fine; cure = sync-local.sh + migrate.

Fix packets dispatched: ADMIN-FATALS (StorageService static, orders/pending, route-name, accounting links, financeYears, seeder), ADMIN-CHROME (DataTables include, feather, chart double-init, message-poller 401, PWA modal suppression, titles, dir=rtl, MAD, banners/stocks/marketplace layout), ADMIN-I18N (lang files all locales), ADMIN-CSS (bare→tw-). QA triage continues (2 suite-killing fatals already fixed: OOM migration + view redeclaration).

## Addendum 22:05 — Admin UI fix wave DEPLOYED

All 4 packets landed + deployed to prod (29 files, git-archive from feat/ai-seller-credits HEAD, autoload 38790 classes, view/route/cache cleared, restart, /tmp/laravel_views + storage chowned, smokes green, 0 fresh log errors):
- CSS bc648ec1: 22 dead bare Tailwind classes → tw- (incl. JS classList toggles); 3 suspect files were actually Bootstrap-utility usage (rounded-lg/px-N/gap-N ARE defined by BS4/BS5) — left alone. Guard: BareTailwindClassTest.
- CHROME 7caf6f45: DataTables JS moved before @yield('page-script') (was after → `$().DataTable is not a function` on orders/stocks/users/categories/carts); feather-icons loaded globally; 401 message-poller early-returns on /admin paths; PWA install prompt suppressed on admin; <title> = "@yield('title') — Beldify Admin"; dir="rtl" added to ar html tag; banners duplicate zero-stats block removed. Chart.js/MAD/overflow/selects verified already-correct.
- FATALS 57e66f8a: StorageService::getUrl() made static — PHP 8 lesson: the static-call fatal fires BEFORE __callStatic is consulted when the method exists as instance; orders pending/processing/completed/cancelled actions added (shared filteredByStatus); locale-prefixed route() name fixed in product-images upload-form; financeYears blade column names (startDate→start_date etc.) + add_finance_year CTA; AccountSubControlSeeder user_id/company_id/branch_id sentinel-0 defaults. Accounting web routes verified repo-correct (501s were container drift).
- I18N 403ef17a: 344 new EN admin keys + full locale catch-up (AR +469, FR +683, ES +696, MA +750 incl. pre-existing gaps). Guard: AdminI18nMissingKeysTest ×5 locales.
Consolidated gate: 5 admin suites, 83 assertions, 0 failures. Local mirror re-synced (sync-local.sh + migrate) — all 8 drift-500s cleared.
Sweep backlog (not fixed, recorded): marketplace Regular/Tailor lists render empty with 2 stores present (data wiring), permissions matrix renders empty/2 of 14 roles, AR admin partially translated, store-less store_owner role hijacks /admin/dashboard via IsActive middleware for multi-role users, admin sidebar Accounting link verify on prod.

## Addendum 22:10 — QA test-debt triage complete

Suite RESTORED (was OOM-dead): Feature 145 failed / 1135 passed, Unit 1/171 (212 → 146). QA commits: 6f368429 (OOM migration + view-redeclaration fatals), 3e775959 (phpunit 512M), ac83918f (CommunityApiTest 9 + SellerSsoBridgeTest 4 → current contract), 95709656 (triage doc + AuthApiTest prefix), c2cb3bd0 (locale-infra doc). Triage: docs/audit/2026-06-10-test-debt-triage.md. Dominant remaining bucket = RouteServiceProvider applies locale prefix in test env → 302→404 loop across seller Blade tests (recommend APP_ENV=testing guard).
15 prod bugs escalated: mobile AuthController register/login/updateProfile broken (no `name` column / is_active on customers table), Admin StockController::update ignores redirect_to, ShopController products_count unfiltered, store_revenues missing commission_rate column, kpi-tiles atlasSparkPoints() lacks function_exists guard (fatal on double render), commission-accounts migration WRITES .env as side effect, es/ma lang 77/75 keys behind en, AdminSharedLayoutTest encodes Atlas intent (bootstrap.min retirement + Playfair + bg-indigo-900/950), seller no-store CTA + verified badge, accounting seeder fixed separately. KB candidates: env-append-migration hazard, locale-redirect test infra, mobile-auth column mismatch.
