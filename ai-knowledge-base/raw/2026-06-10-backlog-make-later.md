# Beldify — Backlog "make later" (saved from overnight session 2026-06-10)

Everything NOT built tonight + activation steps for dormant features. Source of truth for the next sessions.

## A. Activation steps (built tonight, waiting on YOU)

1. **Stripe payments** — built dormant. To activate: get Stripe keys → Admin → `/{locale}/admin/payment-settings` → enter publishable/secret/webhook-secret → enable. Then frontend checkout card option needs wiring to `POST /api/payments/intent` (Stripe.js confirm flow) — small FE task once keys exist. Webhook URL to register at Stripe: `https://api.beldify.com/api/payments/webhook/stripe`.
2. **CMI payments** — requires CMI merchant onboarding (bank). Driver implements the hosted-payment hash flow; enter clientid/store key/gateway URL in the same admin page. Callback URL: `/api/payments/webhook/cmi`.
3. **SMS OTP** — built optional (log driver). To activate: Twilio (account_sid/auth_token/from) or Infobip (base_url/api_key/from) in Admin → `/{locale}/admin/sms-settings` (test-send button included).
4. **Google sign-in** — follow `docs/guides/google-oauth-setup.md` (5 min): create OAuth client → set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend, rebuild) + `GOOGLE_CLIENT_ID/SECRET` (backend .env).
5. **Shipping methods** — endpoint live but prod table empty; create methods in Admin → Shipping to switch checkout off the hardcoded 30/70 fallback.
6. **MegaOffer countdowns** — frontend chip ships, render-gated: backend must expose `ends_at` per product in offer responses (MegaOfferCollection.end_date exists at collection level — propagate per-product).

## B. Features not built (priority order)

1. **Seller payout self-service** — payout_requests table, seller request flow vs pending_payout, bank details on store profile, admin approval console + notifications. (Wave-6 design exists in session log.)
2. **Referral program + loyalty/streaks** — referral codes, signup attribution, credit ledger; "invite via WhatsApp" share.
3. **Shipping zones** — per-city/region fees; carrier API integration (Amana/CTM) beyond manual tracking numbers.
4. **PDF invoices** — printable HTML invoice shipped; real PDF needs `barryvdh/laravel-dompdf` (composer → prod container rebuild).
5. **Meilisearch upgrade** — MySQL FULLTEXT live; for typo-tolerance/synonyms move to Scout+Meilisearch later.
6. **Admin Blade i18n adoption** — 40 keys translated and AVAILABLE in all 5 locales; views still hardcode English — swap `__()` calls in incrementally.
7. **Commission path decision (NEEDS PRODUCT DECISION)** — CommissionService vs CommissionAccountingService diverge: flat_fee in expense debit (new) vs not (old); back-ref transaction ids populated (new) vs not (old); exceptions (new) vs silent log (old). Pick canonical → delegate the other.
8. **"behoutry" competitor teardown** — name unidentified online (EN/AR variants searched); get exact name/URL from user.

## C. Production bugs found by QA-2 (test-side fixed; these are prod-code)

1. Missing mobile API route groups: `/api/mobile/tailoring/*`, `/api/mobile/cart(+/add)`, `/api/mobile/orders`, `/api/mobile/analytics/*`, `/api/mobile/shops/*` — controllers exist, routes never registered (mobile app integration blocked).
2. `Product` model table mismatch: extends Stock but `getTable()` → `products` (legacy table) — add `protected $table = 'stocks'` after impact check.
3. `admin.variants.index` route missing; `ProductVariantController@store` default redirect references it (500).
4. `StockController@update` redirects to `/` instead of stocks index without `redirect_to`.
5. `resources/views/seller/no-store.blade.php` CTA uses `store.request.create`; test expects `seller.storeProfiles.edit` — decide canonical.
6. Admin sidebar/header missing Atlas tokens per AdminSharedLayoutTest (bg-indigo-950/900, Playfair) — align or update tests.
7. `Order.$fillable` still lists dropped `user_id` column — clean up.
8. Mobile `resendOtp`/`verifyOtp` routes are public but call `$request->user()` → 500 without token (route middleware fix).
9. Full-suite OOM: migration `2024_03_15_000006_add_commission_accounts` seeder eats memory — needs chunking; suite needs `-d memory_limit=512M` meanwhile.
10. Remaining suite counts: 22 errors + 131 failures, all catalogued above (was 96E+212 total at session start).

## D. Open Souk UX roadmap (from tonight's analysis; B1/cache + mine-filter already fixed)

- Verify/fix: `getSellerStats` 500 (PostResponse::communityStatsFor missing); accepted-proposal dead-end (no order/deal object after accept — THE loop gap); `has_my_proposal` flag never set in resource.
- Ideas ranked: budget slider + preset chips (1d) · WhatsApp share on post-success (2h, wa.me deep link) · template picker mad-lib create form (1d) · proposal comparison strip (1d) · buyer lifecycle pushes (first proposal / 3+ proposals / expiring) (0.5d) · photo-first AI brief entry via OpenRouter vision (3-4d).

## E. Misc deferred

- `.env` is git-tracked in backend repo (15.8k lines, secrets incl. VAPID private key) — needs untracking + history scrub decision + dedupe of repeated blocks.
- 7 `.bak/.backup` controller files committed — delete.
- cat_18 category image regen; avatars; `api_proxy.php` at backend root unexplained.
- KB lint: 18 errors (wikilink hygiene) — `uv run --directory ai-knowledge-base python scripts/lint.py`.
- Frontend pre-existing test failures (~160: atlas-visual-port/atlas-p0-fixes/a11y-rtl-p0/pdp-chrome) — owned by the parallel session's Atlas workstream.
- Legacy AWS GitHub workflows (sync-changes.yml etc.) target dead Elastic IP — disable or migrate to Contabo deploy.
