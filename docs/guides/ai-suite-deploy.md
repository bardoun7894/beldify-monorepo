# AI Suite — Deploy Runbook

Covers the Kie.ai-powered features built 2026-06-12/13: **AI banner generation**, **virtual try-on** (free + paid wallet), and **seller AI product images**, plus the **financial-document security hardening**.

> Status at time of writing: all feature work is implemented and test-green locally; nothing is merged or deployed. Hold points are called out below.

## 1. Branch map (what to merge, in order)

### Backend (`beldify-backend` — its own git repo)
Merge in this order (each branched from the previous):

1. `feat/ai-banner-generation` — banner gen (commit `e3a5be6f`)
2. `feat/ai-tryon-product-images` — KieClient, try-on, seller images, **paid wallet**, + security fixes (`bfa9d4f6`). Contains #1.
3. `fix/financial-doc-exposure` — payment-proof + seller-credit private-disk fix. **Two isolated commits**: cherry-pick the PaymentProof commit onto `main` (live prod), route the seller-credit commit with feature 007.

### Frontend (monorepo `/projects/beldify`)
- **Ship from `feat/seller-payouts`** — it is the superset (all try-on free+paid+review fixes+leftovers, 7-locale parity). It *also* carries the separate seller-payouts page; split if you want try-on to ship alone.
- ⚠️ Do **not** ship `feat/ai-tryon` — it is stale at `121e340` (missing all review fixes).

## 2. Migrations (additive only)

Backend deploy must run `php artisan migrate --force`:
- `hero_settings` (banner/hero mode)
- `tryon_wallets`, `tryon_wallet_transactions`, `tryon_topups` (paid try-on)
- `ai_settings` rows are key/value — no migration

No destructive operations. Index names are ≤64 chars (MySQL prod limit).

## 3. One-time config (Admin → AI Settings) — required before features work

1. **Kie.ai API key** → `ai.kie.api_key` (encrypted). Get it from kie.ai → API Key Management. Powers banners, try-on, and product images. New accounts get 80 free credits; `402` errors = top up credits.
2. **Banner image model** → `ai.banner.image_model` (default `gpt-image-2-text-to-image`).
3. Try-on toggles: `ai.tryon.enabled`, `ai.tryon.paid` (both default OFF).
4. **Paid mode prerequisites** (only if enabling paid): real **RIB** (`ai.tryon.rib`) and **pack prices** (`ai.tryon.packs`) — currently placeholders. Set before flipping `paid` ON.
5. Seller product images: `ai.product_image.enabled` (default OFF).

All features ship **OFF** — flipping the admin switches is a deliberate go-live step.

## 4. Local verification (before prod)

```bash
# Backend (own repo)
cd beldify-backend && php artisan test --filter='TryOn|KieClient|ProductImageAi|BannerAi'   # 106 green
# Frontend
cd beldify-frontend && npm run test && npm run lint                                          # green, 0 lint
# Sync into the local Docker mirror (named volume — code does NOT bind-mount)
bash sync-local.sh && docker restart beldify-local-app    # sync-local.sh now copies app/routes/config/database + migrates
curl -s http://localhost:7895/api/tryon/config            # {"enabled":false,"paid":false,...}
```

## 5. Prod deploy (Contabo)

Follow the standard Beldify deploy. Reminders specific to this suite:
- Run migrations (§2).
- New Kie env var is **not** needed (key lives in DB `ai_settings`, avoids the 11.5k-line `.env` recreate problem).
- After rsync, re-verify `public/storage` symlink and run `storage:link` (try-on results + AI banner images use the local public disk).
- Smoke: `GET /api/hero-config`, `GET /api/tryon/config` (with `Host: pro.beldify.com`).

## 6. ⚠️ HOLD — requires explicit authorization

**Existing prod payment proofs are already on the public disk.** The `fix/financial-doc-exposure` code only secures *new* uploads (private disk + guarded streaming route). The already-exposed existing files need a separate **DevOps data migration** (relocate `payment-proofs/**` and seller-credit receipts off the web-served disk, rewrite stored paths), complicated by the dead-Contabo / `StorageService` aliasing. **Do not deploy the financial-doc fix without planning this migration** — otherwise old receipts stay exposed and the admin view may 404 on relocated files. Get sign-off first.

## 7. Privacy / security notes

- Buyer try-on photos are **never** stored on Beldify — pass-through to Kie (auto-deletes in 3 days). Try-on results kept 48h then cleaned by the daily scheduler.
- Bank receipts (try-on top-ups, payment proofs, seller credits) are on the **private** `local` disk, served only via auth+role-guarded routes. Filenames use MIME-derived extensions (no caller-controlled extension).
- Public `GET /api/tryon/status` is throttled (`60,1`) so a bot can't burn Kie quota.

## Related
- KB: `[[beldify-ai-banner-generation]]`, `[[beldify-ai-tryon-product-images]]`, `[[beldify-ai-suite-branch-topology]]`, `[[beldify-prod-deploy]]`
- `beldify-backend/docs/ai-image-suite.md` — endpoint + admin reference
