---
name: "Seller AI Tools & Credit Billing"
description: "Beldify sellers buy credits (bank-transfer receipt → admin approval) and spend them on AI tools — listing writer, store-profile writer, listing translation, marketing copy — charged atomically before the AI call with idempotent refunds on failure"
type: concept
tags: [laravel, seller, checkout, payment, product, whatsapp, ai, multi-seller, bank-transfer]
sources: [raw/2026-06-10-feature-007-seller-ai-credits.md]
created: "2026-06-10"
updated: "2026-06-10"
---
# Seller AI Tools & Credit Billing

Feature 007 monetizes Beldify's DB-backed AI infrastructure as a seller-facing product. Each store has a `credit_wallets` row whose balance is mirrored by an append-only `credit_transactions` ledger (signed amounts, `balance_after`, with the invariant that the ledger sum equals the balance). Credits are purchased offline-first, in keeping with the platform's payment posture: the seller picks a `credit_pack`, transfers to the platform RIB, uploads a receipt (`credit_purchases`), and an admin approves or rejects from `/admin/credits/*` — the same PaymentProof shape used by checkout bank transfers. Instant top-up via CMI/Stripe is deferred to the dormant payment-gateway foundation. A configurable welcome bonus (default 10 credits) is granted once per store.

The billing core is `CreditService::charge`, which debits atomically under `lockForUpdate` and signals shortage with a 402 `{error:insufficient_credits,balance,cost,feature}` contract that the frontend converts into an `InsufficientCreditsModal` on every 402. Charging happens BEFORE the AI call; if the AI returns null the charge is refunded idempotently (`refund:{id}` reference) and the API returns 502 `ai_failed`. Four endpoints ship in v1 — `POST /api/seller/ai/{listing,store-profile,translate-listing,marketing}` — riding `AiManager`/`ChatClient->json()`; marketing copy strips phone numbers after generation to honor the WhatsApp-never-checkout growth rule. Pricing assistant, AI reply drafts, an Open Souk proposal writer, and image enhancement are roadmap items.

The seller surface is `/seller/credits` (balance, packs, purchase flow, history) plus a balance chip in the seller header and `AiGenerateButton` components with live cost badges embedded in product new/edit (listing writer + auto-translate with a review step), store-settings/onboarding (store-profile writer), and the products list (marketing-copy sheet). Receipt files are forced onto the local public disk (`credit-receipts/{storeId}/`) because the platform's default disk still points at the revoked Contabo S3. The feature was built and QA-gated (69/69 BE, 1895/1895 FE) on `feat/ai-seller-credits`, stacked on `feat/hero-admin-switch`, and was unmerged as of 2026-06-10.

## See also
- [[sources/2026-06-10-feature-007-seller-ai-credits]]
- [[concepts/beldify-dormant-features-activation]] — the dormant CMI/Stripe foundation that will later power instant top-up
- [[concepts/multi-seller-ecommerce]]
- [[entities/beldify]]
- [[entities/laravel]]
