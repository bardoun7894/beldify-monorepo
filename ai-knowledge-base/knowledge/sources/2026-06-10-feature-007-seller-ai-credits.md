---
name: Feature 007 — Seller AI tools + credit billing (2026-06-10)
description: Implementation log for feat/ai-seller-credits — per-store credit wallets with append-only ledger, four credit-charged seller AI endpoints, admin credits console, and the /seller/credits frontend; QA gate PASS, unmerged at time of writing
type: source
sources: [raw/2026-06-10-feature-007-seller-ai-credits.md]
created: 2026-06-10
updated: 2026-06-10
---

# Feature 007 — Seller AI tools + credit billing (2026-06-10)

## Summary
Implementation log for feature 007 (spec at `specs/007-ai-seller-credits/`), built 2026-06-10 on branch `feat/ai-seller-credits` in both repos and unmerged at time of writing. Sellers buy credits (bank-transfer receipt → admin approval) and spend them on four AI tools (listing writer, store-profile writer, listing translation, marketing copy). QA gate passed: 69/69 backend tests, 1895/1895 frontend tests, lint + tsc + build clean.

## Key points
- **Credit system (BE a14ab830)**: per-store `credit_wallets`; append-only `credit_transactions` ledger (signed amount, `balance_after`, invariant ledger-sum == balance); `credit_packs`; `credit_purchases` (receipt upload → admin approval); `CreditSetting` key-value (welcome_bonus=10, bank_details RIB seeded empty, per-feature costs). `CreditService::charge` is atomic (`lockForUpdate`) and returns 402 `{error:insufficient_credits,balance,cost,feature}`; `refundCharge` idempotent via `refund:{id}`; welcome bonus granted once per store.
- **Seller AI endpoints (BE a8c325a1)**: `POST /api/seller/ai/{listing,store-profile,translate-listing,marketing}` — charge BEFORE calling AI (`AiManager` → `ChatClient->json()`), refund + 502 `ai_failed` on null result; responses include `{credits_charged,balance,result}`. Marketing copy strips phone numbers post-AI (WhatsApp-never-checkout rule). `product_id` resolves via the stocks table.
- **Admin console (BE 2a3b010d)**: `/admin/credits/*` — purchase approve/reject queue (double-approve safe via lock + grant ref `purchase:{id}`), packs CRUD, settings, manual adjustment with no overdraw, `database`-channel seller notification. Receipt storage forced to LOCAL public disk (`credit-receipts/{storeId}/`) because the default disk is the dead Contabo.
- **Frontend (9b021a0, fa5b38c)**: `/seller/credits` page (balance, packs → RIB + receipt purchase, history); balance chip in seller header; `InsufficientCreditsModal` (named export) on every 402; `AiGenerateButton` with live cost badges; listing writer + auto-translate on product new/edit with a review step; store creator in store-settings + onboarding; marketing-copy sheet on products list; `credits` + `ai` i18n namespaces × 5 locales.
- **User decisions (2026-06-10 ~19:10)**: all four AI tools in v1 (pricing assistant, AI reply drafts, Open Souk proposal writer, image enhancement → roadmap); purchase = bank transfer + receipt (PaymentProof pattern) with CMI/Stripe instant top-up later via the dormant gateway foundation; welcome bonus yes, configurable (default 10).
- **Deploy/open**: set real `credits.bank_details` RIB + real pack pricing (placeholders Starter 20/50, Pro 50/100, Business 120/200 MAD); 5 migrations `2026_06_10_1900xx` + `CreditSeeder --force`; no new env vars (AI keys are DB-backed). Branch is stacked on `feat/hero-admin-switch`; the backend branch also carries concurrent-session commits (1ab9a8b6, d3ed4d57, 7d60d3be).
- **Gotchas**: an orchestrator subagent cannot fan out (Agent tool blocked one level deep) — the parent session must dispatch workers itself; a session-limit kill mid-worker leaves untracked partial work (resume by auditing disk state); the local docker mirror needed manual sync of new files before backend tests would run.

## See also
- [[concepts/seller-ai-credits]]
- [[concepts/beldify-dormant-features-activation]]
- [[concepts/multi-seller-ecommerce]]
- [[entities/beldify]]
