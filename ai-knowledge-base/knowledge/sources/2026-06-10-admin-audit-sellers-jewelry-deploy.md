---
name: Admin audit + sellers-on-prod + jewelry + full deploy (2026-06-10 evening)
description: Three backend fix packets (seller, admin routes, accounting/R10) deployed via git-archive-over-ssh; prod data fixes (jewelry seeded, seller roles); commission R10 closed incl. duplicate-OrderObserver P0; admin UI sweep + 4 fix packets; nightly DB backups added
type: source
sources: [raw/2026-06-10-admin-audit-sellers-jewelry-deploy.md]
created: 2026-06-10
updated: 2026-06-10
---

# Admin audit + sellers-on-prod + jewelry + full deploy (2026-06-10 evening)

## Summary
Evening session covering an admin audit, prod seller/data fixes, the jewelry category, accounting closure, and two production deploys. Backend `main` = `a2f0f90b` deployed to MyContabo via git-archive-over-ssh (`git archive main -- <files> | ssh tar -x -C <tree>`) — ships exactly committed content, immune to dirty-tree and rsync symlink-kill hazards. The hero admin switch went fully live end-to-end (`/api/hero-config` → `{"mode":"brand","banners":[]}`).

## Key points
- **Fix packets**: SELLER `a0de0843` — `hasMyProposal` as a per-request overlay OUTSIDE `CacheService::remember` (cache-poison rule held); `ProposalAcceptedNotification` to both parties with messages deep links; sellerStats `avg_rating` computed from CommunityInteractionReview (was always null); several "open" KB items found already fixed (stock-update redirect, no-store CTA loop, /seller/messages registration, mobile API routes at api.php:609, store-settings PUT). ADMIN `3df136b7` — missing `admin.variants.*` routes wired under admin/stocks/{stock_id}/variants + `admin.marketplace.stores.show`; null-safe stores/show view; AdminPagesSweepTest (17 assertions). ACCT `a2f0f90b` — **R10 CLOSED**: canonical morph = `Store::class` (store+platform) / `User::class` (affiliate); the writer (OrderObserver) was always canonical, the READER (`CommissionController::summary`) was wrong and read the dead `commission_transactions` table; flat-fee double-count fixed. **P0: duplicate OrderObserver registration removed from EventServiceProvider — the observer fired twice → double commissions/revenue.** Two-model verdict: `Commission` = authoritative live record, `CommissionTransaction` = accounting/settlement model.
- **Prod data fixes**: jewelry category (id 20) was empty → 6 stocks seeded (ids 13–18) with unsplash images verified 200 before insert; fatima@example.com had NO role → `store_owner` granted; admin@beldify.com had only legacy `super_admin` → canonical `super-admin` added (gates check the hyphen spelling).
- **Architecture clarifications**: the catalog lives in the `stocks` table, NOT `products` — `products` is a legacy ERP table, empty everywhere; prod API routes are Host-scoped (smokes must send `Host: pro.beldify.com` or every /api/* 404s); k3s ingress: www/beldify.com → frontend 4987, pro/api.beldify.com → backend nginx 7894, Cloudflare caches API max-age=300; Laravel cache lives in Redis db1 with AUTH; mysqlbinlog is absent from the mysql:8.0 container.
- **Ops hardening**: prod had NO database backups — nightly 03:30 mysqldump cron added (`/root/db-backups/`, 7-day retention, baseline taken).
- **Incident**: a concurrent session rewound `feat/hero-admin-switch` mid-merge, orphaning 3 packet commits; recovered via cherry-pick (new SHAs). Lesson: with 2+ live sessions in one repo, capture commit SHAs immediately and treat refs as volatile.
- **Scheduler inventory**: scheduled — `carts:process-abandoned` (hourly 09–21), `wishlist:send-notifications` (daily 10:00, covers price-drop + back-in-stock). No Artisan command exists for flash sales, coupon expiry, or commission settlement (manual web CRUD only).
- **Admin UI sweep (addenda 21:30/22:05)**: NO live Bootstrap/Tailwind collisions — coexistence by design (Tailwind `prefix: 'tw-'`, 269 admin views); static debt: Bootstrap 5.3 + Tailwind each loaded twice (~450KB dead CSS/page, dedup deferred). 46-route visual sweep found 13 real bugs; 8 further 500s were local-mirror container drift only. All 4 fix packets deployed (29 files): CSS bc648ec1 (22 bare→tw- classes + BareTailwindClassTest guard), CHROME 7caf6f45 (DataTables include order, feather global, 401 poller suppressed on admin, PWA prompt suppressed, titles, dir=rtl), FATALS 57e66f8a (StorageService::getUrl() made static — the static-call fatal fires BEFORE __callStatic when the method exists as instance; orders pending/processing/completed/cancelled actions; financeYears columns), I18N 403ef17a (344 new EN admin keys + AR +469 / FR +683 / ES +696 / MA +750, AdminI18nMissingKeysTest ×5).
- **QA triage (22:10)**: suite restored from OOM-dead — Feature 145 failed / 1135 passed (was 212 → 146 failures); dominant remaining bucket = RouteServiceProvider applies locale prefix in test env (302→404 loop); 15 prod bugs escalated (mobile AuthController register/login broken on missing `name` column, env-append-migration hazard, etc.).
- **Open/blocked**: SMTP auth 535 — all prod email dead pending password fix; backend `.env` git-tracked (15.8k lines, secrets) — untrack decision pending; only categories 4/5/8/20 have products, 14 leaf categories empty.

## See also
- [[concepts/beldify-commission-system]]
- [[concepts/hero-admin-switch]]
- [[concepts/open-souk-feature]]
- [[concepts/admin-atlas-migration]]
- [[concepts/multi-seller-ecommerce]]
- [[entities/beldify]]
