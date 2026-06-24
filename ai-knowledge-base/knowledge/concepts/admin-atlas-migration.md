---
name: Admin Backend Atlas Migration
description: Quantified scope and priority roadmap for migrating the Beldify Laravel admin from Bootstrap 4/PixInvent to Atlas Tailwind-only
type: concept
sources: [daily/2026-05-21.md, daily/2026-05-23.md, daily/2026-05-24.md, daily/2026-05-28.md, daily/2026-05-29.md, daily/2026-05-31.md]
created: 2026-05-21
updated: 2026-05-31
---

# Admin Backend Atlas Migration

## Overview
The Beldify Laravel admin surface (~280 Blade views) was built on the PixInvent/AdminLTE Bootstrap 4 template. As of 2026-05-21 a full audit quantified the migration scope to Atlas (Tailwind-only, Lucide icons, indigo-900/amber-500 palette). The estimated effort exceeds 120 engineer-hours — a multi-sprint project. The audit produced a prioritized refactor roadmap and identified several production correctness bugs unrelated to aesthetics.

## Key Points
- **Scale**: ~280 admin views; 189 contain Bootstrap structural classes; 60 still use PixInvent layout classes (`content-overlay`, `content-wrapper`, `content-header-left`, etc.)
- **Icon libraries**: Line Awesome (117 files), Font Awesome (39 files), Feather JS (1 file), PixInvent ft-* icon font (a few files) — Lucide is used in **zero** admin files
- **Off-palette colors**: 471 occurrences of green/blue/yellow/purple/red Tailwind classes against Atlas tokens
- **Bootstrap modal patterns**: 97 BS4 `data-toggle` + 17 BS5 `data-bs-toggle` — mixed inconsistently in the same app
- **Estimated effort**: 120+ engineer-hours (multi-sprint)
- **Chrome layer value**: fixing sidebar/topbar/master layout delivers ~80% of visual improvement across all pages at a fraction of the total effort

## Details
A reviewer agent surveyed ~28 of ~280 views (10% direct coverage) and applied grep-based signal across the full corpus to produce per-cluster summaries and global findings.

### Tier breakdown by migration state
| Cluster | State |
|---------|-------|
| marketplace/stores, commissions (partial), orders/show, orders/analytics | Partially migrated — `tw-` prefix utilities, x-tables components, but off-palette colors remain |
| customers, users, categories (wrappers), stocks (wrappers), banners, community | Hybrid — Bootstrap grid wrapper with Tailwind content panels inside |
| mega-offers, configuration, tailoring/fabrics, tailoring/accessories | 100% Bootstrap 4 / AdminLTE — untouched |

### Production correctness bugs discovered (not cosmetic)
1. **Phantom `tw-primary-*` tokens** — commissions cluster uses `tw-bg-primary-600` etc. in 64 places; these are not real Tailwind classes and render invisible/unstyled in production (see [[concepts/tailwind-jit-dynamic-class-pitfalls]])
2. **Dynamic Tailwind class construction** — `tw-bg-{{ $commission->getStatusColor() }}-100` defeats JIT purger; these classes vanish in production builds
3. **`@apply` in inline Blade `<style>`** — `banners/index.blade.php` lines 8–52 emits raw `@apply` directives to the browser; PostCSS never compiles them
4. **Mixed Bootstrap 4/5 modal syntax** — same file uses both `data-toggle` (BS4) and `data-bs-toggle` (BS5); BS4 attributes don't work with the loaded BS5 bundle
5. **URL typo**: `customers/create.blade.php:11` has `url('/dashbaord')` (production routing bug)

### Missing assets
- `public/images/empty-banners.svg` — referenced in banners empty state
- `public/images/admin-logo.png` — referenced in commissions/rates/create
- `public/plugins/bs-custom-file-input/` — referenced in tailoring/styles/create

### Reviewer's recommended 3-packet priority order
1. **Commissions cluster** (~8 files) — fixes `tw-primary-*` phantom tokens + JIT-purge dynamic class bugs; correctness before cosmetics
2. **Orders cluster** — high admin traffic; thin Bootstrap wrappers + Atlas palette badge cleanup; half-day effort
3. **Community moderation cluster** — most visually jarring off-palette (blue/green gradient stat cards), `las` icon → Lucide swap, Bootstrap 5 modals → Alpine.js dialogs

### Work completed on 2026-05-21 (morning — session bb534dba)
- `head.blade.php`, `head_ar.blade.php`, `header.blade.php`, `sidebar.blade.php` — Atlas chrome refactor with EN+AR translations; 7 passing tests
- `dashboard/index.blade.php` — Atlas KPI tiles + Chart.js revenue/orders sparklines; new partials `widgets/kpi-tiles.blade.php` and `widgets/recent-activity.blade.php`; 10 passing tests
- Lang files `resources/lang/{en,ar}/messages.php` — deduped and deployed to container (fixes `messages.*` literals leaking in the UI)

### Work completed on 2026-05-21 (afternoon — session 1295f6ce)
After the APP_URL → MIME-type pipeline was unblocked (see [[concepts/admin-asset-url-misconfiguration]]) and a panel vote confirmed finishing Atlas over pivoting to Filament (see [[concepts/admin-panel-migration-decision]]), the commissions correctness packet was executed:

**Commissions correctness packet**
- Commission model: added `getStatusBadgeClass()`, `getStatusLabel()`, `getTypeBadgeClass()` helper methods using static `match()` — all class strings are literals visible to JIT; killed 4 known dynamic-construction spots
- `tw-primary-*` phantom tokens replaced with real Atlas tokens (`tw-bg-indigo-700`, `tw-text-amber-800`, `focus:tw-ring-amber-300` etc.) across all 6 commission views

**Vite build unblocked**
- Removed 11 dead Vue component imports from `resources/js/app.js` (`MessagingContainer.vue` and 10 others that no longer exist on disk); Vite was failing at bundle time on missing files

**Community brand alignment**
- 11 gradient swaps: `from-blue-500 to-blue-600` → `from-indigo-700 to-indigo-800` across community stat cards and section headers; aligns with Atlas indigo `#0E5C9B` primary

**`@apply` in Blade fixed**
- `banners/index.blade.php` lines 8–52: `@apply` directives moved from inline `<style>` to `resources/css/admin-banners.css` (Vite-processed); direct utility classes used where possible

**RTL CSS anchor**
- Sidebar, header, footer: `margin-left`/`margin-right` → `margin-inline-start`/`margin-inline-end`; `left`/`right` absolute positions → `inset-inline-start`/`inset-inline-end`; ensures correct flip under `dir="rtl"` without extra overrides

**~405 KB CSS removed from admin heads**
- `css/app.css` and `css/tailwind.css` (full Vite build outputs) were included via `<link>` in admin `<head>` tags in addition to the admin-specific asset URLs — a duplicate that bloated every admin page load; both removed; only `admin/app-assets/...` CSS links remain

**Atlas fonts applied to admin heads**
- Replaced Google Fonts `Open Sans` + `Quicksand` (load from external CDN) with `Playfair Display` + `Inter` (Atlas spec: Playfair for headings, Inter for body); reduces external requests and matches the customer-facing Atlas appearance

**CI lint guard created** (see [[concepts/tailwind-jit-dynamic-class-pitfalls]] for rules)
- `.github/workflows/admin-lint.yml` added with 4 grep-based rules to prevent JIT-purge regression on every PR

### Work completed on 2026-05-23

**V3 Sidebar + Header (replacing V2)**
- Complete rewrite with `bdv3-` prefix isolation — zero shared classes with PixInvent's `.main-menu`, `.nav-link`, `.menu-collapsed`
- Parchment surface (amber-50 `#FFFBEB`) + Atlas Indigo-900 text + Saffron Amber accents
- Collapse rail (272px → 72px icon rail) with hover tooltips, `\` keyboard shortcut, `localStorage` persistence
- **Submenu toggle fix**: `grid-template-rows: 0fr` approach abandoned (fails with multi-child `<ul>`); switched to `max-height: 0 → 32rem` — see [[concepts/css-accordion-max-height-pattern]]
- **RTL layout fix**: `margin-inline-*` logical properties lost cascade against PixInvent's physical `[dir="rtl"] .dash-content { margin-right: 260px }`; fixed to matching physical properties per direction — see [[concepts/css-rtl-override-physical-properties]]
- Cmd+K command palette: 59 sidebar entries indexed, fuzzy scoring, amber substring highlight, keyboard navigation
- Section icons (Line Awesome) in Saffron Amber next to each of 8 section headers
- Real notification feed in header bell (pulls from `NotificationServiceProvider`)
- See [[concepts/beldify-admin-v3-sidebar]] for full spec

**V3 Component Library (`resources/views/components/v3/`)**
- 11 reusable Blade components: `page-header`, `kpi-tile`, `badge`, `avatar`, `btn`, `data-table`, `empty-row`, `section-card`, `form-row`, `input`, `toggle`
- Canonical page recipe reduces any list page to ~36 lines of Blade
- See [[concepts/beldify-admin-v3-component-library]] for catalog + props + usage

**Pages ported on 2026-05-23**
11 admin pages ported using the component library:
- Carts: index, abandoned, analytics, settings (all sub-items)
- Orders: index, analytics, settings (all sub-items)
- Purchases: allPurchases, purchaseInvoices, purchasePaymentPending, purchaseReturns

**Bugs fixed on 2026-05-23**
- `fetchBestSellers BadMethodCallException` (pre-existing): `routes/api.php:153` → now points to `BestSellersController::index`; two sibling dead routes commented out
- Cart sidebar route names: `carts.*` → `admin.carts.*` (swept 6 files)
- Missing translation keys: `messages.abandoned`, `messages.apply`, `messages.search_carts`, `messages.filter_by_status`, `messages.search_orders`, `cart_timeout`, `send_abandoned_cart_notifications` added to AR + EN locale files
- 500 error chain: PSR-4 namespace mismatch (macOS `Api/` vs Linux `API/`) → opcache pinning stale classmap → env_file frozen after `docker restart` — all resolved in sequence; see [[concepts/php-opcache-deployment-pitfall]] and [[concepts/docker-env-file-recreation]]

### Work completed on 2026-05-24

**V3 sidebar indigo gradient restyle (v8→v10)**
- Surface changed from parchment (amber-50) to indigo gradient (`from-indigo-900 to-indigo-800`) to unify with Atlas page-header gradient
- v8: indigo gradient; v9: amber active-item glow (amber-400 left-border + text); v10: badge count pill styles
- Section labels fully translated EN/AR/FR/MA in sidebar
- 50 menu items → 17 (marketplace focus: kept Commerce, Catalog, Marketplace, Community, Finance, Settings; removed internal-ops noise)
- Messages item added to sidebar

**SidebarBadgeService + ViewComposer**
- 5 dynamic badge keys (pending_sales, pending_purchases, pending_orders, abandoned_carts, store_requests)
- Redis cache `sidebar:v3:badges:user:{id}`, 5-min TTL, `bust()` method
- See [[concepts/sidebar-badge-service]]

**`x-v3.search-input` component**
- Flex-based icon+input Blade component replacing broken `tw-px-10` absolute-position pattern
- Deployed via `perl -0777 -i -pe` to 11 table view files across catalog, tailoring, marketplace clusters

**Catalog cluster ports (8 files)**
- categories, stocks, customers, suppliers, branches, warehouses, stock movements, mega offers — all ported to V3 component library
- Bug: `translateField(optional($model))` TypeError — `optional()` returns `Illuminate\Support\Optional`, rejected by `?Model` type hint; fixed by dropping `optional()` wrapper

**Tailoring cluster ports (6 files)**
- orders, fabrics, accessories, measurements, styles, services — ported to V3
- Bug: fabrics `company_id` column missing from schema — added `Schema::hasColumn()` guard in controller; returns empty DataTables payload rather than 500

**Marketplace cleanup: store surface deduplication**
- Three overlapping store surfaces existed: `admin.marketplace.stores.*`, `admin.storeProfiles.*`, `stores.*`
- Canonical surface consolidated to `admin.storeProfiles.*`
- `admin.marketplace.stores.index` → redirects to `admin.storeProfiles.index`
- Dead marketplace/stores views deleted; sidebar deduplicated

**Community cluster ports + route fixes**
- 4 community views ported to V3
- Fixed: `CommunityImage` model import → `PostImage`; `$image->community_post_id` → `$image->post_id`
- Fixed: `admin.community.images.delete` route never registered → added DELETE route
- Fixed: `admin.community.responses.delete` → `admin.community.responses.destroy` (name mismatch in 2 view files)

**Admin config, store requests, commissions views**
- Admin configuration, store request management, commissions cluster — V3 ported
- Fixed: `Route [admin.community.responses.delete]` name mismatch

**Seller dashboard lean rewrite**
- `seller_shell` layout: dedicated mobile-first layout for sellers (5-tab bottom nav + desktop pill nav)
- No PixInvent dependency; `bdvs-` CSS prefix; ~7 KB CSS; RTL-aware; iOS safe-area aware
- See [[concepts/seller-shell-layout]]
- Register + store-setup views rewritten: register-v3 (196 lines vs 569 old), create-v3 (152 lines vs 624 old)
- Seller community UX (Open Souk): Freelancer-style browse/bid/track flow (1788→450 lines across 3 views)
- Seller messages: inbox + chat thread views with bubble styling
- Specs created: `specs/006-seller-experience/` (5 slices: register wizard, products CRUD, orders/profile v3, reports, storefront preview)

**Route + middleware fixes across clusters**
- `affiliate` middleware → `role:affiliate` (Spatie) fix
- `Route::has()` guard pattern for broken route names (degrade to `#` instead of throwing)
- Missing translation keys in 4 locales fixed: MESSAGES.CODE literal fallback traced to `__()` returning key string (not null) when key missing — `?? 'fallback'` never fires; solved by adding keys

**Next.js Atlas frontend migration (see [[concepts/atlas-frontend-migration]])**
- Phase 1-4 parallel agent fan-out; git worktree isolation per worker
- Phase 4 gap analysis: 245 missing locale keys, 30 console.log leaks, 45 RTL leaks, 35 bg-primary tokens — Phase 5 remediation pending

### Work completed on 2026-05-28 (session 6d18f0a6)

**Static service call anti-pattern fix (blocker)**
- `CacheService` and `StorageService` instance methods were called with `::` static syntax across 43 files (~118 call sites)
- Replaced all with `app(ClassName::class)->method()` — see [[concepts/laravel-static-service-anti-pattern]]
- Root cause of initial white-screen 500 on admin pages at session start

**V3 sidebar wiring (critical — files existed but were never included)**
- `dashboard.blade.php` and `seller_dashboard.blade.php` still `@include('admin.includes.sidebar')` (v1) despite v3 files existing since 2026-05-23
- Fixed: both layouts changed to `@include('admin.includes.sidebar-v3')` + `@include('admin.includes.header-v3')`
- `bdv3-shell` class added to `<body>` in both layout files

**Atlas body skin fix (three compounding causes)**
1. CSS `:has()` pseudo-class unreliable in user's browser — replaced all 29 selectors across `v3-pages.css`, `sidebar-v3.css`, `header-v3.css` with `body.bdv3-shell` — see [[concepts/css-has-selector-body-class-hook]]
2. `light-mode-fixes.css` global `html, body { background-color: #fff !important }` was overriding Atlas parchment — scoped to `body:not(.bdv3-shell)`
3. PHP opcache held stale compiled blade views — container restart required after each fix

**PixInvent RTL `data-textdirection` fix**
- PixInvent sets `data-textdirection="rtl"` on `<body>`, NOT `dir="rtl"` on `<html>` — all 18 RTL CSS selectors in `sidebar-v3.css` + `header-v3.css` corrected — see [[concepts/pixinvent-rtl-data-textdirection]]
- Symptom: Arabic admin content overlapping sidebar by ~25%

**128 admin pages ported (3 parallel agent waves)**
- Wave 1: orders/index.blade.php — verified working, used as template
- Wave 2: 17 pages across 4 parallel agents (catalog, marketplace, users, finance)
- Wave 3: 90 form/CRUD pages across 5 parallel agents
- All pages now use `<x-v3.page-header>` + `<x-v3.section-card>` — see [[concepts/beldify-admin-v3-component-library]]

**Api/API Linux case-sensitivity fix**
- `app/Http/Controllers/Api/` directory on prod Linux server had PSR-4 mismatch with `API` namespace declarations
- 6 files had `namespace App\Http\Controllers\Api` (lowercase); renamed directory, fixed namespaces, updated 3 route files
- `route:list` went from fatal crash to 930 routes after `composer dump-autoload -o` + restart

**Tailoring fabrics schema fix**
- `tailoring_fabrics` is an order line-item table; controllers queried non-existent `company_id`, `stock_quantity`, `name` columns
- Fixed with `collect()` (empty result) + `Schema::hasColumn()` guard in `TailoringOrderController` and `TailoringFabricController`

**Route guard sweep (50 broken references)**
- Background agent swept all admin views for unguarded `route()` calls
- 50 references scanned; 1 genuinely unguarded (`admin.community.images.delete` in `community/show.blade.php`) — fixed with `@if(Route::has(...))` guard — see [[concepts/laravel-blade-route-guard-pattern]]

**Storage log permissions fix**
- `storage/logs/` owned by macOS uid 501; PHP-FPM (www-data) couldn't create new daily log
- Fix: `chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R ug+rwX`

**Prod-local git drift catch-up**
- CSS cache-buster versions bumped directly on prod but never committed locally — see [[concepts/prod-local-git-drift]]
- Catch-up commit `3fcedfe5` for `head.blade.php`; `dashboard.blade.php` and `seller_dashboard.blade.php` dirty-state synced before each rsync

### Work completed on 2026-05-29

**Community pages i18n — admin list + detail + seller view**
- `admin/community/index.blade.php`: fixed `MESSAGES.TOTAL_POSTS`, `MESSAGES.TOTAL_RESPONSES`, `MESSAGES.TOP_CONTRIBUTORS`, `MESSAGES.TITLE` uppercase leaks (keys absent from all 5 locale files); eyebrow/subtitle, status badges, search bar, and pagination converted to `messages.*` keys
- `admin/community/posts/show.blade.php`: full i18n sweep (all English literals → `messages.*`); status label unified from two vocabularies (`published/pending/rejected/archived` and `open/in_progress/closed`) into a single translated map; Quick Actions block replaced Tailwind `tw-bg-*` utilities (absent from admin CSS bundle) with scoped `<style>` + semantic classes — see [[concepts/tailwind-jit-dynamic-class-pitfalls]]
- `seller/community/show.blade.php`: removed fabricated data cards (fake "Blue/Purple/Formal/Evening" garment specs and "Skills Required" panel); fixed pre-existing 111-open/109-close div imbalance → 103/103 balanced; 35 literals converted to `messages.*`
- ~42 new keys added to `resources/lang/{ar,en,fr,ma,es}/messages.php` for community cluster (both admin and seller-facing): `community_management`, `community_posts`, `total_posts`, `total_responses`, `top_contributors`, `active_this_period`, `cps_status_*` (open/pending_review/closed/archived/published/rejected), `quick_actions`, approve/reject/archive/pending actions, `user_information`, `post_responses`, `post_data`, `open_souk_label`, pagination keys

**Storage::url(null) guard**
- Community post image loops used `Storage::url($image->path)` without checking for null paths; rows with null images crashed `Storage::url()` with `TypeError`
- Fixed: `@if($image->path)` guard added before each `Storage::url()` call in admin community views

**display_name accessor + mb_ multibyte fix**
- "Top Contributors" widget and author columns were blank because `$user->name` is always null on Beldify (no `name` column in `users` table)
- `getDisplayNameAttribute()` locale-aware accessor added to `User` model; avatar initials converted from `strtoupper(substr(...))` to `mb_strtoupper(mb_substr(...))` — see [[concepts/laravel-user-display-name-accessor]]

**Bug fixes (correctness, not cosmetic)**
- `StoreRequestController:49` null-safe: `$store->id` → `$store?->id` (admin user has no store, `first()` returns null)
- `store-profiles/settings.blade.php`: `@extends('layouts.admin')` (non-existent) → `@extends('admin.dashboard')`
- `commissions/payments/index.blade.php`: `@extends('admin.admin.dashboard')` (double prefix) → `@extends('admin.dashboard')`
- `MarketplaceController` phantom eager-load `with('type')` removed (real relationship is `storeType`)
- Seller products route rewired from `API\SellerProductController` (JSON-only, no `index`/`create`) to `Seller\ProductController`
- `SellerProfileController::update` was writing to non-existent columns (`name`/`phone`/`address`) — fixed to `full_name_en`/`contact_number`/`address_en`
- `customer_select2` route named (view called `route('customer_select2')` but route had no name)
- Spatie role name collision: `super-admin` (hyphen) ≠ `super_admin` (underscore) — both variants added to affected admin users
- `IsActive` middleware redirect loop: admin user with `store_owner` role but no store → infinite redirect; fixed by assigning an approved store to the admin user

**Local Docker mirror established**
- Production Contabo server code + DB mirrored to `docker-compose.local.yml` (ports 7895/3307/6381, `beldify-local-*` container names, named volume `beldify_local_code`)
- Named volume (Linux ext4) used instead of macOS bind mount to prevent case-sensitivity bugs in translator and PSR-4 — see [[concepts/docker-local-production-mirror]] and [[concepts/macos-docker-case-sensitivity-pitfall]]
- Dual-apply pattern: all fixes applied to local mirror via `docker cp` for immediate testing, AND to `beldify-backend` git repo as targeted edits to preserve in-progress Atlas migration changes

**Checkpoint commit**
- 342-file commit pushed after community i18n + Quick Actions + null guards + display_name work completed

### Work completed on 2026-05-31

**Admin dashboard Atlas polish (impeccable pass)**
- Eyebrow + subtitle: hardcoded `eyebrow="Overview"` → `__('messages.overview')` + Arabic subtitle key added; en/ar/fr translations added
- Currency: all `DH` occurrences in PHP KPI values → `formatMoney()` / `Currency::getCurrencySymbol()`; JS chart tooltips also updated
- Leaking keys: `placeholder="messages.search_orders"` / `messages.filter_by_status` were literal strings missing from lang files; added `search_orders`, `filter_by_status`, `created_at_label`, `items` to en/ar/fr (form components already call `__()` internally — keys were absent, wrappers were not missing)
- Chart palette: all 6 admin charts repainted from random colors to Atlas Indigo `#4338CA` + Saffron Amber `#F59E0B` + emerald/teal supporting tones
- Seller dashboard: fixed blank KPI icons caused by dead Line Awesome 1.1.0 CDN — upgraded to 1.3.0 matching admin (see [[concepts/line-awesome-cdn-version-fix]])
- PRODUCT.md created at project root (required by `/impeccable` skill; defines audience, a11y bar, anti-references)
- See [[concepts/admin-dashboard-atlas-polish]] for full details

**Backend: VariantWriteService + options-matrix builder**
- `VariantWriteService::upsert()` extracts canonical variant write; wired to admin `ProductVariantController` + seller `ProductController` + manage controller (see [[concepts/variant-write-service]])
- Double-encode bug fixed: `json_encode()` was called before Eloquent cast on `attributes` column — service now assigns PHP array directly
- Options→matrix variant builder: seller declares Color + Size options → system auto-generates all combinations at base price; merge-preserves edited stock; `current_purchase_unit_price` regression fixed (see [[concepts/options-matrix-variant-builder]])
- Missing `product_variants.attributes` column migration created (deploy-blocking for production — `php artisan migrate` required on staging/prod)
- `ProductManagementController` orphaned JSON API methods deprecated with `abort(503)`
- `ProductVariantPunchListTest`: 6 tests passing

**Blade ParseError fixed**
- `seller/community/show.blade.php:35` had unclosed `@if($sellerResponse)` — missing `@endif` inserted; 111-open/109-close imbalance resolved
- Hardcoded `DH` in product offer prices → `formatMoney()`

**Dual-mode seller dashboard**
- Full Simple/Advanced progressive disclosure design spec completed (10-agent workflow)
- All 18 seller views migrated to `seller_shell` layout
- Toggle dropdown replaces earlier two-pill segmented control; pre-paint localStorage persistence
- KPI grid: mobile 3-tile strip → 2×2 grid; Active Products added as 4th tile; MAD locale-aware currency; purple gradient removed
- See [[concepts/dual-mode-seller-dashboard]]

## Related Concepts
- [[concepts/tailwind-jit-dynamic-class-pitfalls]] — Production correctness bugs found during the audit; CI guard added; admin CSS context variant (admin pages load PixInvent CSS, not Vite build)
- [[concepts/atlas-design-system]] — Target design system for the migration
- [[concepts/docker-deployment]] — Container where files are deployed via `docker cp`
- [[concepts/admin-asset-url-misconfiguration]] — Infrastructure blocker resolved before afternoon work could proceed
- [[concepts/admin-panel-migration-decision]] — Panel verdict to finish Atlas rather than pivot to Filament
- [[concepts/beldify-admin-v3-sidebar]] — V3 sidebar; wiring fix + body class fix on 2026-05-28
- [[concepts/sidebar-badge-service]] — Dynamic badge counts for V3 sidebar
- [[concepts/seller-shell-layout]] — Dedicated seller layout built as part of this migration
- [[concepts/atlas-frontend-migration]] — Parallel Next.js storefront migration; same Atlas tokens
- [[concepts/laravel-static-service-anti-pattern]] — Service call anti-pattern fixed at start of 2026-05-28 session
- [[concepts/css-has-selector-body-class-hook]] — `:has()` → body class fix for Atlas skin
- [[concepts/pixinvent-rtl-data-textdirection]] — Non-standard RTL attribute; 18 selector fixes
- [[concepts/prod-local-git-drift]] — Prod-ahead CSS state causing regression risk
- [[concepts/laravel-blade-route-guard-pattern]] — Route::has() guard pattern sweep
- [[concepts/docker-local-production-mirror]] — Local production mirror used for 2026-05-29 testing
- [[concepts/macos-docker-case-sensitivity-pitfall]] — Root cause requiring named volume for local mirror
- [[concepts/laravel-user-display-name-accessor]] — display_name accessor added during community i18n work
- [[concepts/variant-write-service]] — VariantWriteService canonical variant normalizer; double-encode bug; missing `attributes` migration
- [[concepts/options-matrix-variant-builder]] — Shopify-style options→matrix variant builder on seller product form
- [[concepts/dual-mode-seller-dashboard]] — Simple/Advanced progressive disclosure seller dashboard
- [[concepts/line-awesome-cdn-version-fix]] — Blank seller icons root cause: LA 1.1.0 CDN dead; fixed to 1.3.0
- [[concepts/admin-dashboard-atlas-polish]] — impeccable pass: MAD currency, Atlas charts, i18n, leaking placeholder keys
- [[concepts/beldify-local-volume-sync]] — Named Docker volume sync pattern; Tailwind rebuild + opcache restart required
- [[entities/laravel]] — Framework whose Blade views are being migrated

## Sources
- [[daily/2026-05-21.md]] — Full audit performed; scope quantified; 3-packet priority order established; chrome layer + dashboard partials completed (morning); commissions correctness + Vite unblock + community alignment + RTL + CSS savings + fonts applied (afternoon)
- [[daily/2026-05-23.md]] — V3 sidebar/header fully replacing V2 (parchment surface, collapse rail, Cmd+K palette); V3 component library built; cart/orders/purchases pages ported to V3 design language; `bdv3-` prefix isolation strategy prevents PixInvent conflicts
- [[daily/2026-05-24.md]] — V3 sidebar indigo gradient restyle (v8→v10); 50→17 item simplification; SidebarBadgeService; x-v3.search-input; catalog/tailoring/marketplace/community/commissions/store-requests ported; seller dashboard lean rewrite + seller_shell layout; seller experience specs (006); Next.js Atlas Phase 1-4 parallel migration; Phase 4 gap analysis (245 locale gaps, 30 console.log, 45 RTL leaks)
- [[daily/2026-05-28.md]] — Static service anti-pattern fix (43 files); V3 sidebar wiring; Atlas body skin fix (`:has()` → `body.bdv3-shell`, light-mode-fixes scoping, opcache); RTL `data-textdirection` fix; 128 pages ported via 3 parallel agent waves; Api/API Linux case fix; tailoring fabrics schema fix; 50-route guard sweep; storage permissions fix; prod-local git drift catch-up
- [[daily/2026-05-29.md]] — Community pages full i18n (admin list + detail + seller view); Quick Actions CSS fix (admin PixInvent bundle, not Vite build); Storage::url null guard; display_name accessor; 8 correctness bug fixes; local Docker production mirror established (named volume, dual-apply pattern); 342-file checkpoint commit
- [[daily/2026-05-31.md]] — Admin dashboard Atlas polish (impeccable); PRODUCT.md created; VariantWriteService + options-matrix builder; missing `product_variants.attributes` migration; unified admin product page; dual-mode seller dashboard design spec; all 18 seller views on seller_shell; blank seller icons (LA 1.1.0→1.3.0); community/show ParseError fixed

## See also
- [[sources/panel-2026-05-21-admin-css-js-conflicts]]
