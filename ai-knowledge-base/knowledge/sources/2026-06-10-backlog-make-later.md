---
name: Beldify backlog — "make later" (2026-06-10)
description: "Post-overnight-session backlog — activation steps for dormant built features (Stripe, CMI, SMS OTP, Google, shipping methods), features not built, QA-2 prod-code bugs, and the Open Souk UX roadmap"
type: source
tags: [laravel, blade, migration, seeder, request, route, model, html, mysql, seller]
sources: [raw/2026-06-10-backlog-make-later.md]
created: "2026-06-10"
updated: "2026-06-10"
---
# Beldify backlog — "make later" (2026-06-10)

## Summary
The authoritative backlog saved from the 2026-06-10 overnight session: everything NOT built that night plus the activation steps for features that were built dormant. It is organized into activation steps awaiting the user, unbuilt features in priority order, production bugs found by QA-2, the Open Souk UX roadmap, and miscellaneous deferred items.

## Key points
- **Activation steps (built dormant, waiting on user)**: Stripe (keys → Admin `/{locale}/admin/payment-settings`; frontend checkout card option still needs wiring to `POST /api/payments/intent`; webhook `https://api.beldify.com/api/payments/webhook/stripe`); CMI (requires bank merchant onboarding; hosted-payment hash flow implemented; callback `/api/payments/webhook/cmi`); SMS OTP (log driver default; Twilio or Infobip creds in Admin `/{locale}/admin/sms-settings` with test-send button); Google sign-in (`docs/guides/google-oauth-setup.md`, ~5 min); shipping methods (endpoint live but prod table empty — create methods in Admin → Shipping to switch checkout off the hardcoded 30/70 fallback); MegaOffer countdown chip (render-gated: backend must expose per-product `ends_at`).
- **Features not built (priority order)**: seller payout self-service (Wave-6 design exists), referral program + loyalty/streaks, shipping zones + carrier APIs (Amana/CTM), PDF invoices (printable HTML shipped; real PDF needs `barryvdh/laravel-dompdf` + container rebuild), Meilisearch upgrade (MySQL FULLTEXT live now), admin Blade i18n adoption (40 keys translated in 5 locales; views still hardcode English), commission path decision (CommissionService vs CommissionAccountingService diverge — NEEDS PRODUCT DECISION), "behoutry" competitor teardown (name unidentified).
- **QA-2 prod-code bugs**: missing mobile API route groups (`/api/mobile/tailoring/*`, `cart`, `orders`, `analytics`, `shops` — controllers exist, routes never registered); `Product` model extends Stock but `getTable()` → `products` (legacy table); `admin.variants.index` route missing (500 from `ProductVariantController@store` redirect); `StockController@update` redirects to `/`; seller no-store CTA route mismatch; admin sidebar missing Atlas tokens per test; `Order.$fillable` lists dropped `user_id`; mobile `resendOtp`/`verifyOtp` public routes call `$request->user()` → 500; full-suite OOM from a commission-accounts migration seeder (needs chunking; `-d memory_limit=512M` meanwhile); remaining suite 22 errors + 131 failures (was 96E+212F at session start).
- **Open Souk UX roadmap** (B1/cache + mine-filter already fixed): verify `getSellerStats` 500 (`PostResponse::communityStatsFor` missing); accepted-proposal dead-end (no order/deal object after accept — THE loop gap); `has_my_proposal` flag never set in resource. Ideas ranked: budget slider + preset chips (1d), WhatsApp share on post-success (2h), template-picker mad-lib create form (1d), proposal comparison strip (1d), buyer lifecycle pushes (0.5d), photo-first AI brief entry via OpenRouter vision (3-4d).
- **Misc deferred**: backend `.env` git-tracked (15.8k lines incl. VAPID private key) — needs untracking + history-scrub decision; 7 `.bak/.backup` controllers committed; cat_18 category image regen; KB lint 18 errors (wikilink hygiene); ~160 pre-existing frontend test failures owned by the parallel Atlas workstream; legacy AWS GitHub workflows target a dead Elastic IP.

## See also
- [[concepts/beldify-dormant-features-activation]]
- [[concepts/marketplace-completeness-roadmap]]
- [[concepts/open-souk-feature]]
- [[sources/2026-06-10-completeness-audit]]
