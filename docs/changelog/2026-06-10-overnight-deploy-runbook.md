# Overnight deploy runbook — 2026-06-10

Status: PREPARED (fills in as fix-batch packets land). Target: MyContabo (`ssh MyContabo`), backend tree `/var/local/beldify-monorepo/beldify-backend`, bind-mounted into `beldify-backend` container.

## Why deploy

Active prod errors fixed by local commits not yet shipped:
- `community_posts.status` enum truncation on admin moderation (fix: eff44495 + f231c48c — widen-enum migration, MySQL-only)
- `admin.marketplace.stores.show` undefined route 500 (fix: 157559b7)
- `GET /api/products/featured` 500 — `ProductController::fetchFeatured` missing (fix: BE-1 packet tonight)
- Open Souk seller tag-notify fix (b25b7e36)

## Infra facts established tonight (read-only inspection)

| Item | State | Action |
|---|---|---|
| Host cron `schedule:run` | ✅ exists, every minute → `/var/log/beldify-schedule.log` | none — BE-2 scheduler tasks fire automatically once deployed |
| Queue | `QUEUE_CONNECTION=redis` (no cached config), **NO queue worker process**, queues empty, no failed jobs | add flock-guarded cron pump (below) |
| Mail | smtp.hostinger.com:465 configured, **`MAIL_FROM_ADDRESS=` empty** | set `MAIL_FROM_ADDRESS=no-reply@beldify.com` + `MAIL_FROM_NAME="Beldify"` in prod .env before password-reset emails ship |
| storage/logs perms | fixed tonight (chown www-data) | recheck after any rsync (known gotcha de94bba) |
| Disk | 37% used | fine |
| Prod backend git | local junk commits ("ok","need") — rsync-managed | rsync specific files only; NEVER sync-and-run.sh (overwrites prod .env) |
| macOS `Api/` vs Linux `API/` | case-sensitivity gotcha (memory) | rsync file-by-file, verify lowercase dupes not reintroduced |

## Queue worker (apply during deploy)

```bash
ssh MyContabo 'crontab -l | { cat; echo "* * * * * flock -n /tmp/beldify-queue.lock docker exec beldify-backend php artisan queue:work redis --stop-when-empty --max-time=55 --tries=3 >> /var/log/beldify-queue.log 2>&1"; } | crontab -'
```

## Backend deploy steps (after local tests green)

1. Build file list: `git -C beldify-backend diff --name-only origin/main..HEAD` (+ tonight's commits).
2. `rsync -avz --files-from=<list> beldify-backend/ MyContabo:/var/local/beldify-monorepo/beldify-backend/`
3. New env vars (append to prod .env, then NO config:cache since none cached): `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `FRONTEND_URL=https://beldify.com` (check first — BE-1 reset links depend on it).
4. `docker exec beldify-backend php artisan migrate --force` (new migrations: enum widen + tonight's — list below).
5. `docker exec beldify-backend sh -c 'php artisan view:clear && php artisan route:clear && php artisan cache:clear'`
6. `docker restart beldify-backend` (opcache — composer untouched so no rebuild).
7. Fix perms: `docker exec beldify-backend chown -R www-data:www-data /var/www/html/storage`
8. Smoke: `/api/health`, `/api/products/featured` (expect 200), `/api/v1/community/posts`, admin dashboard page, community moderation approve/reject, homepage.

### Migrations from tonight (all additive — confirmed)
- [x] (BE-1) 2026_06_10_000001_create_contact_messages_table
- [x] (BE-1) 2026_06_10_000002_create_return_requests_table
- [x] (BE-1) 2026_06_10_000003_add_cancel_columns_to_orders_table (cancelled_at, cancellation_reason)
- [x] (BE-2) 2026_06_10_000001_add_recovery_notified_at_to_carts_table
- [x] (BE-2) 2026_06_10_000002_create_coupons_table
- [x] (main) 2026_06_10_000004_add_coupon_permissions (manage_coupons → admin/super-admin)
- [x] (pre-existing unpushed) community status enum widen
- [ ] (ACCT) pending report — likely none (schema already exists)

### Commits to ship (backend repo, branch fix/opensouk-tag-notify)
157559b7 admin stores.show 500 · eff44495+f231c48c community enum widen · b25b7e36 open-souk tag notify · 53435904 wip checkpoint · 059d2fd9 admin Atlas dashboard · 8f2bb6c2 growth engine+coupons · 67ac0f0e manage_coupons perm · 6c4036ee storefront APIs · + ACCT commit pending

### New env vars (fill from packet reports)
- backend: MAIL_FROM_ADDRESS, MAIL_FROM_NAME, FRONTEND_URL
- frontend: NEXT_PUBLIC_GOOGLE_CLIENT_ID (needs user's Google OAuth client — NOT available tonight; button auto-hides until set)

## Frontend deploy (HOLD for morning unless build verifies + user awake)

Frontend prod = standalone tree, runs uncommitted code, deploy via git apply / careful rsync WITHOUT --delete (memory: beldify-frontend-prod-deploy + sync-and-run footguns). Requires `docker-compose.prod.yml` build for SW/PWA correctness. Riskier than backend — default: prepare diff, deploy in morning.

## Rollback

- Backend files: rsync the previous file versions back (git checkout HEAD~N -- <file> locally then rsync), `docker restart beldify-backend`.
- Migrations tonight are additive (new tables/columns/enum-widen) — safe to leave on rollback.
- Queue pump cron: `crontab -e` remove line.

## Deploy #2 — EXECUTED 03:5x (wave 3-4 backend)

18 files (commits 9a095868, 0fd5f1fd, 3f49d5cb, 8fa1f87a, 1b0633fc): shipping-methods endpoint,
address book CRUD + addresses migration (ran ✓), email verification API, accounting completion
(balanceSheet view, finance-year activate, voucher reversals), checkout shipping_method_id
pass-through, custom-order schema validation. rsync used --keep-dirlinks. dump-autoload 38738
classes, restart, chown. Smokes: shipping-methods 200 (empty → checkout fallback), addresses 401,
verification-notification 401, verify 422, regression set + homepage all 200.

NOTE: shipping methods table empty on prod — checkout keeps hardcoded 30/70/free>500 behavior
until methods are created in admin (Admin → Shipping). Frontend deploy still HELD for morning.

## Morning incident — 06:45 (prod console errors) — FIXED

Two user-visible prod failures found on www.beldify.com homepage:

1. **Category images 400** via `/_next/image` — two stacked causes:
   - `public/storage` symlink GONE on prod (overnight rsync killed it despite
     --keep-dirlinks on deploy #2 — deploy #1 didn't use it). Files were intact in
     `storage/app/public/categories/`. Fix: `docker exec beldify-backend php artisan storage:link`.
   - API emitted `http://91.230.110.187:7894/storage/...` URLs (APP_URL holds the
     internal origin), which next/image remotePatterns rightly rejects. Fix:
     `ASSET_URL=https://pro.beldify.com` appended to prod `.env` (filesystems.php
     public-disk url prefers ASSET_URL), then `docker compose -f docker-compose.backend.yml
     up -d --force-recreate --no-deps app` (env_file is read at container create) +
     `config:clear` + `cache:clear`. Verified: getAllCategories now returns
     `https://pro.beldify.com/storage/...`, `_next/image` → 200 image/jpeg.
   - `.env` backup left at `beldify-backend/.env.bak-assetfix-<ts>` on the server.

2. **sw.js "s.defaultCache is not iterable"** — SW evaluation failed, PWA dead.
   Root cause in source (NOT a dev-vs-prod build issue): `src/app/sw.ts` imported
   `defaultCache` from `'serwist'`, but it is exported by `@serwist/next/worker`.
   `typescript.ignoreBuildErrors: true` let it through; runtime spread of
   `undefined` threw. Fix: corrected import, rebuilt frontend image
   (`docker compose -f docker-compose.prod.yml build frontend && up -d frontend`).

**Post-rsync checklist addition (alongside storage/logs perms):** verify
`public/storage` symlink exists in the backend tree after EVERY rsync:
`docker exec beldify-backend sh -c 'ls -ld /var/www/html/public/storage || php artisan storage:link'`
