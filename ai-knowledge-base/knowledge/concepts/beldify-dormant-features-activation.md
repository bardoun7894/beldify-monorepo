---
name: Beldify Dormant Features & Activation Steps
description: Features built but switched off pending external credentials or decisions — Stripe, CMI, SMS OTP, Google sign-in, shipping methods, MegaOffer countdowns — and the exact steps to activate each
type: concept
sources: [raw/2026-06-10-backlog-make-later.md, raw/2026-06-10-feature-007-seller-ai-credits.md, raw/2026-06-10-admin-audit-sellers-jewelry-deploy.md, raw/marketplace-frontend-ai-review/2026-06-19-full-frontend-ai-review.md]
created: 2026-06-10
updated: 2026-06-19
---

# Beldify Dormant Features & Activation Steps

## Overview
The 2026-06-10 overnight session deliberately shipped several features in a **dormant** state: the code paths are complete and tested, but each waits on an external credential, a data row, or a product decision before it does anything in production. This page is the activation checklist; the full backlog context is in [[sources/2026-06-10-backlog-make-later]].

## Activation checklist
- **Stripe**: enter publishable/secret/webhook-secret keys in Admin → `/{locale}/admin/payment-settings` and enable. The frontend checkout card option still needs a small wiring task to `POST /api/payments/intent` (Stripe.js confirm flow) once keys exist. Register the webhook at Stripe as `https://api.beldify.com/api/payments/webhook/stripe`.
- **CMI**: requires CMI merchant onboarding through the bank. The driver implements the hosted-payment hash flow; enter clientid/store key/gateway URL in the same admin page. Callback URL: `/api/payments/webhook/cmi`.
- **SMS OTP**: built optional with a log driver default. Activate with Twilio (account_sid/auth_token/from) or Infobip (base_url/api_key/from) in Admin → `/{locale}/admin/sms-settings`, which includes a test-send button.
- **Google sign-in**: follow `docs/guides/google-oauth-setup.md` (~5 min) — create the OAuth client, set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend, needs rebuild) and `GOOGLE_CLIENT_ID/SECRET` (backend .env).
- **Shipping methods**: the endpoint is live but the prod table is empty; creating methods in Admin → Shipping switches checkout off the hardcoded 30/70 MAD fallback. **Correction (2026-06-19):** the 30/70 MAD figures are the *base* costs only — a real **500-MAD free-shipping threshold already exists end-to-end** (`shippingService.ts` marks standard delivery free at subtotal ≥ 500, checkout honors it, the cart shows an "add X MAD more" progress hint, and a test asserts it). The 2026-06-19 review refuted the earlier "no free-shipping rule" claim; the standing gap is only the empty `ShippingMethod` table, not the free-shipping logic. See [[concepts/marketplace-frontend-ai-review]].
- **MegaOffer countdowns — CORRECTION (2026-06-20): NOT dormant.** Earlier notes claimed the countdown chip was render-gated on a missing per-product `ends_at`. Verified false against the code: the countdown ("X days left") is **live at the collection level** and actively rendered on the home teaser (`MegaOffers.tsx:123`) and both `/mega-offers` pages (`page.tsx:144`, `[slug]/page.tsx:133`), reading `collection.end_date` which `MegaOffersController` already returns. `MegaOfferProductCard.tsx` has **no per-product countdown** — there is nothing gated on `ends_at` to activate. Adding a per-product `ends_at` to the API would feed no consumer. A per-product *ticking* countdown chip would be a NET-NEW feature (FE card + BE field), not an activation. **Separate real bug found during this check:** `MegaOffersController::formatProductsData()` reads pivot columns `special_price`/`discount_percentage`/`discount_amount` that the 2025-06-05 migration DROPPED (pivot now has `discount_type`/`discount_value`) — per-product mega-offer discounts silently resolve to null. That is the actual MegaOffer gap worth fixing.

## Decisions blocking further work
- **Commission path — RESOLVED 2026-06-10**: the divergence between `CommissionService` and `CommissionAccountingService` was settled by the R10 closure as a deliberate two-model split — `Commission` is the authoritative live record, `CommissionTransaction` the accounting/settlement model; the reader (not the writer) was wrong. See [[concepts/beldify-commission-system]] and [[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]].
- **"behoutry" competitor teardown**: the name could not be identified online under any EN/AR spelling; the exact name/URL must come from the user.

## Unbuilt (priority order)
Seller payout self-service (payout_requests table + admin approval console; Wave-6 design exists) → referral + loyalty/streaks → shipping zones + carrier APIs → real PDF invoices (printable HTML already shipped; `barryvdh/laravel-dompdf` needs a container rebuild) → Meilisearch (MySQL FULLTEXT is live in the meantime) → admin Blade i18n adoption (40 keys already translated in 5 locales; views still hardcode English).

## Downstream consumers of the dormant gateway foundation
The seller credit system (feature 007) deliberately launched on the bank-transfer + receipt pattern; CMI/Stripe instant credit top-up is queued behind the same gateway activation steps above — see [[concepts/seller-ai-credits]].

## See also
- [[sources/marketplace-frontend-ai-review-2026-06-19]]
- [[concepts/marketplace-frontend-ai-review]]
- [[sources/2026-06-10-backlog-make-later]]
- [[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]]
- [[concepts/marketplace-completeness-roadmap]]
- [[concepts/multi-seller-ecommerce]]
- [[concepts/beldify-commission-system]]
- [[concepts/seller-ai-credits]]
