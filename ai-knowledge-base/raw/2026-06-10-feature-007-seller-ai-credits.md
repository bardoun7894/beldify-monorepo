# Feature 007 — Seller AI tools + credit billing (built 2026-06-10, unmerged)

Branch `feat/ai-seller-credits` in BOTH repos. Spec + research: `specs/007-ai-seller-credits/`. QA gate PASS (69/69 BE, 1895/1895 FE, lint+tsc+build clean).

## What shipped

- **Credit system** (BE a14ab830): per-store `credit_wallets`, append-only `credit_transactions` ledger (signed amount, balance_after; invariant ledger-sum == balance), `credit_packs`, `credit_purchases` (bank-transfer receipt upload → admin approval), `CreditSetting` key-value (welcome_bonus=10, bank_details RIB seeded EMPTY, per-feature costs). `CreditService::charge` atomic (lockForUpdate) → 402 `{error:insufficient_credits,balance,cost,feature}`; `refundCharge` idempotent (`refund:{id}`); welcome bonus once per store.
- **Seller AI endpoints** (BE a8c325a1): `POST /api/seller/ai/{listing,store-profile,translate-listing,marketing}` — charge BEFORE AI (`AiManager`→`ChatClient->json()`), refund + 502 `ai_failed` on null. `{credits_charged,balance,result}` responses. Marketing strips phones post-AI (WhatsApp-never-checkout). product_id via stocks table.
- **Admin console** (BE 2a3b010d): `/admin/credits/*` — purchase approve/reject queue (double-approve safe via lock + grant ref `purchase:{id}`), packs CRUD, settings, manual adjustment (no overdraw), `database`-channel seller notification. Receipt storage forced to LOCAL public disk (`credit-receipts/{storeId}/`) — default disk is dead Contabo.
- **Frontend** (interleaved + 9b021a0, fa5b38c): `/seller/credits` page (balance, packs → RIB + receipt purchase, history), balance chip in seller header, `InsufficientCreditsModal` (named export `@/components/seller/InsufficientCreditsModal`) on every 402, `AiGenerateButton` with live cost badges, listing writer + auto-translate in product new/edit (review step before apply), store creator in store-settings + onboarding, marketing-copy sheet on products list. i18n `credits` + `ai` namespaces × 5 locales.

## Decisions (user, 2026-06-10 ~19:10)

1. All four AI tools in v1; pricing assistant / AI reply drafts / Open Souk proposal writer / image enhancement → roadmap.
2. Purchase = bank transfer + receipt (PaymentProof pattern); CMI/Stripe instant top-up later via dormant gateway foundation.
3. Welcome bonus yes, configurable (default 10).

## Open for user / deploy

- Set real `credits.bank_details` RIB + real pack pricing (placeholders Starter 20/50, Pro 50/100, Business 120/200 MAD) in /admin/credits.
- Deploy: 5 migrations `2026_06_10_1900xx` + `php artisan db:seed --class=CreditSeeder --force`. No new env vars (AI keys already DB-backed).
- Merge order note: branch stacked on feat/hero-admin-switch; backend branch also carries concurrent-session commits (1ab9a8b6 Open Souk, d3ed4d57 R10, 7d60d3be admin routes).

## Gotchas learned

- Orchestrator subagent cannot fan out (Agent tool blocked one level deep) — parent session must dispatch workers itself.
- Session-limit kill mid-worker leaves untracked partial work; resume by auditing disk state, not re-running blind.
- Local docker mirror needed manual sync of new files (config/ai.php, routes/admin.php, factories, push_subscriptions migration) before backend tests would run.
- KB candidates from workers: beldify-seller-credit-system, beldify-seller-ai-tools, beldify-seller-credits-ux, 007-qa env-sync hazard.
