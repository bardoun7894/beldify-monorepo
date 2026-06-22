# Beldify Guest Checkout — Fix Session Handoff

**Date:** 2026-06-19 (deploys) → handoff written 2026-06-20
**Scope:** Implementing the `marketplace-ux-audit` P0s, then fixing **guest checkout end-to-end** on production (`www.beldify.com` → API `pro.beldify.com`).
**Status:** ~95% done. Guest cart works at the API level; one UI gap remains (see §3).

---

## 1. What shipped to production (verified)

Guest checkout was blocked by a **stack of independent issues**, each fixed and deployed via the live-tree rebuild (`docker compose -p beldify-monorepo -f docker-compose.prod.yml up -d --build frontend`):

| # | Blocker | Layer | Fix | Build |
|---|---|---|---|---|
| 1 | `/checkout` in `protectedRoutes` | FE auth guard | removed | #1 |
| 2 | 4 axios clients hard-redirect on **any** 401 (incl. guest 401 on `cart/related-products`) | FE interceptors | guard: redirect only when an auth token actually existed | #2,#3 |
| 3 | PDP `handleAddToCart` + `handlePurchaseNow` gate guests → `/login` | FE component | removed guest guards | #4 |
| 4 | Add-to-cart no-ops for variant-less products (catalog serves flat `stocks` rows with no nested `product.stock`) | FE component | `stock.id → stock_id → product.id` fallback (matches `handlePurchaseNow`) | #5 |
| 5 | **CORS did not expose/allow `X-Guest-Token`** → browser couldn't read or send the guest cart token | **Backend** `config/cors.php` | added `X-Guest-Token` to `allowed_headers` **and** `exposed_headers`; `config:clear` + `docker restart beldify-backend` | backend |
| 6 | Guest token never persisted (header dropped through SW/XHR cross-origin) | FE `lib/api.ts` | generate + persist a **stable client-side guest token**, always send on `/api/*` | #6 |
| 7 | (attempted) token-gen race on first load | FE `lib/api.ts` | mint the guest token **once at module load** (`ensureGuestToken()`) | #7 — did NOT fix the UI cart (see §3: ruled out the race) |

Plus the original **8 audit P0s** (build #1): Toaster un-gated in prod (feedback was invisible), pinch-zoom restored (`userScalable`), PDP trust pills de-faked, star→reviews link, RTL cart arrow, ProductCard real add-to-cart, PII out of debug toasts.

**Verified live:** `/checkout` + `/cart` load for guests (no login bounce); add-to-cart shows **"Item added to cart ✓"** toast; seller identity renders on PDP; **guest cart persists at the API level** — `POST /api/cart/items` + `GET /api/cart` with the same `X-Guest-Token` returns the item (correct total). CORS now exposes + allows `X-Guest-Token` (curl-confirmed).

**Rollback images tagged on prod:** `beldify-frontend:rollback-uxfixes` (pre-session) and `-2` … `-7` (each build). Restore with `docker tag … && docker compose … up -d frontend`.

---

## 2. Prod deploy mechanics (confirmed this session)

- Frontend = real `next build`/`next start` **image**; build context = the **live host tree** `/var/local/beldify-monorepo/beldify-frontend` (`COPY . .`). **No bind-mount.** Editing files does nothing until rebuild.
- Deploy = update files in the live tree → `docker compose -p beldify-monorepo -f docker-compose.prod.yml up -d --build frontend` (run detached via `nohup` — SSH drops clobber the build).
- **Never** `rsync --delete` or `sync-and-run.sh` — the compose file warns prod has hand-edited files that only exist on the box (e.g. `HomeContent.tsx`). Copy only the specific changed files.
- Backend container `beldify-backend`; config changes need `php artisan config:clear` + `docker restart beldify-backend` (opcache).
- SSH `root@91.230.110.187` (host `vmi3015200`). `scp`/sftp is flaky; use `tar … | ssh … tar xf -`. Watch for transient "Network is unreachable" blips.

---

## 3. THE ONE REMAINING GAP — guest cart never holds the item the UI "added"

**Symptom:** A guest taps add-to-cart (sometimes a "Item added ✓" toast even shows), but `/cart` stays empty AND the **backend cart under the browser's stored `guest_token` is empty (count 0)**.

**Definitively established (black-box, prod, no more deploys productive):**
- **Backend guest cart is keyed PURELY by `X-Guest-Token`** (cookie-jar test: same session + no token → 0; no session + token → 1; no session involvement, no session cookie set).
- **A fixed-token, sequential flow ALWAYS works:** `POST /api/cart/items` then `GET /api/cart` with the *same* `X-Guest-Token` returns the item (correct total). So backend + CORS + response-shape are all fine (`{status:'success', data:{items[], cart{subtotal,…}}}` matches `CartContext.fetchCart` exactly).
- **Response cache is NOT the cause:** `@/app/api/cache` is an in-memory `Map` (resets on full reload), and `addItem` calls `invalidateCartCache()` (clear + `fetchCart(true)`).
- **Token race is NOT the (sole) cause:** build #7 mints the guest token **once at module load** (`ensureGuestToken()`), so all requests share one token — yet `/cart` is **still empty** and the stored token's backend cart is **still 0**.
- A browser request-layer probe (patched XHR + fetch to log whether each `/api/cart` call sent a token matching `localStorage.guest_token`) saw **ZERO `/api/cart` requests** after a UI add-to-cart click on an enabled, in-stock button — and no toast. So **the UI add intermittently fires no cart POST at all.**

**Conclusion:** the failure is in the **client add path**, not the token/backend. The UI add-to-cart does **not reliably reach `cartService.addItem` → `POST /api/cart/items`** for this product. Either `handleAddToCart` bails in a branch before the API call, or the success path runs but the POST goes out under a token that differs from the one `/cart` later reads. This CANNOT be resolved by black-box clicking — it needs **logging inside the running code**.

**Repro + instrument (dev — `docker-compose.dev.yml`, where console.logs are visible and chunks are unhashed):**
1. Add temp logging at the top of `handleAddToCart` (`src/app/products/[id]/page.tsx`) — which branch is taken, the resolved `stockId`, and right before `addItem`.
2. Log inside `cartService.addItem` (`src/services/api/cartService.ts:49`) the outgoing payload, and in `lib/api.ts` request interceptor the actual `X-Guest-Token` sent on **both** the POST and the subsequent GET.
3. Clean guest → PDP for a variant-less product (`/products/17`, which is a flat stocks-row: no variants, no nested `product.stock`) → click add → watch: did `addItem` run? did the POST fire? same token on POST and the `/cart` GET? what did the GET return?
4. Likely fixes once observed: (a) `handleAddToCart` reaching a silent bail/guard for stocks-row products despite the build-#5 fallback; or (b) a second token-writing path (e.g. response interceptor adopting a backend-rotated token, or `withCredentials` interplay) that desyncs add-token vs read-token.

**Do NOT chase this with more prod rebuilds** (8 done). Prod is GREEN and strictly better than before; this is the last, isolated thread for a dev session.

### Dev trace findings (2026-06-20, build #8 + branches `fix/guest-shopping-flow` / `fix/guest-cart-related-products`)
Ran a real dev server (`next dev` on a temporarily-CORS-allowed port, prod API, console NOT stripped) with `[CARTDBG]` logging. Captured on a guest add-to-cart for the variant-less product 17:
- `handleAddToCart entry | hasVariants=false | resolvedStockId=17 | quantity=1` ✓ (handler fires, stock id correct)
- `addItem payload {stock_id:17,quantity:1}` ✓ → `addItem response.status: success` ✓
- **BUT** the `[CARTDBG]` request/response interceptor in `src/lib/api.ts` logged `/api/tryon/config` calls and **NEVER `/api/cart` or `/api/cart/items`** — even though `cartService` imports the SAME `@/lib/api` and `tryonService` (which logs) imports it identically.
- **Network showed `OPTIONS /api/cart/items → 204` (CORS preflight) with NO completed POST.**
- Backend re-confirmed working: a manual same-token `POST`+`GET` (curl AND browser fetch) persists the item; backend honors `X-Guest-Token` verbatim.
- `/cart` rendered empty in dev too (bug reproduces off-prod).

**Interpretation:** the app's cart write is not landing where the read looks. The cart POST either doesn't traverse the instrumented `lib/api` axios instance (despite the identical import) or its actual (post-preflight) credentialed request is dropped — while a plain same-token fetch works. This is contradictory through black-box MCP tools and needs **real Chrome DevTools** (Network tab: inspect the actual `POST /api/cart/items` request headers — is `X-Guest-Token` present? same value as the GET? — and its response headers/status; plus a breakpoint in `cartService.addItem`/the `lib/api` request interceptor) on a **stable single-session checkout of the branch** (no concurrent branch switching, fresh `next dev` compile). Suspects to confirm there: (a) a second axios instance actually serving cart calls; (b) `withCredentials:true` + a stale session/XSRF cookie causing the actual POST to be blocked while preflight passes; (c) a stale/duplicate compiled module.

---

## 4. ⚠️ Local repo ⟂ prod divergence (READ BEFORE DEPLOYING FROM LOCAL)

Prod's **live tree** is the source of truth for what's deployed. The local monorepo working tree was reverted/changed externally mid-session and is **behind prod**. Deploying the local tree would **regress 7 files**.

**DIVERGED — local is MISSING prod's deployed fix (reconcile FROM prod before any local→prod deploy):**
- `src/lib/api.ts` (local = reverted original; prod = 401-guard + broadened `/api/` token scope + stable token-gen)
- `src/app/layout.tsx` (local still has `maximumScale:1`/`userScalable:false`; prod removed them)
- `src/app/layout-client.tsx` (Toaster un-gate)
- `src/app/products/[id]/page.tsx` (guest guards removed + stock-id fallback)
- `src/components/products/ProductCard.tsx` (real add-to-cart)
- `src/components/cart/CartMobileBar.tsx` (RTL arrow)
- `src/contexts/AuthContext.tsx` (guest-cart merge on register + checkout removed from protectedRoutes)

**In sync (local == prod):** `src/services/api.ts`, `src/lib/axios.ts`, `src/services/communityService.ts`.

**Backend:** `beldify-backend/config/cors.php` — edited both local and prod (the `X-Guest-Token` lines). Backend is a nested git repo.

**Safe reconciliation:** pull prod's live-tree versions of the 7 diverged files into local (`tar … | ssh root@91.230.110.187` from `/var/local/beldify-monorepo/beldify-frontend`), review, then commit. Nothing was committed/pushed this session.

---

## 5. Other open items (not blocking guest purchase)
- Backend: make `cart/related-products` + cart coupon endpoints **guest-public** (currently 401 for guests — gracefully ignored now, but they don't populate).
- PDP **wishlist** (`handleWishlistToggle`) still redirects guests to `/login` — should use the client-side guest wishlist (`[[beldify-guest-wishlist]]`).
- Original audit P1s needing API fields: seller name/rating on cards, real shipping cost + delivery ETA, facet-driven + seller-quality filters, COD-limit warning. See `2026-06-19-buyer-journey-full-audit.md`.

---
**Next session start here:** §3 (cart-display fetch) in a dev env, then §4 (reconcile local↔prod).
