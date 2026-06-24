# Feature 007 — AI Seller Tools + Credit Billing

**Status**: approved by user 2026-06-10 19:06–19:15 (3 scope decisions locked)
**Branches**: `feat/ai-seller-credits` (monorepo + nested beldify-backend repo)

## Problem

Sellers get no AI help anywhere in the seller dashboard, even though the platform
already has a working AI layer (`AiManager` → OpenRouter, DB-backed encrypted keys).
The platform also has no monetization beyond order commissions. This feature adds
seller-facing AI tools and monetizes them with a prepaid credit system.

## User decisions (locked)

1. **v1 AI tools — all four**: listing writer, store creator, listing auto-translate, marketing copy.
2. **Credit purchase v1**: bank transfer + receipt upload (reuse `PaymentProof` pattern), admin approval grants credits. CMI/Stripe slot in later (gateway foundation exists, dormant).
3. **Welcome bonus**: yes — configurable free credits granted once per store (default 10) so sellers can try the AI.

## Scope — v1

### Credit system (backend)

- `credit_wallets` — one per store: `store_id` (unique FK), `balance` (unsigned int), timestamps.
- `credit_transactions` — append-only ledger: wallet FK, `type` enum (`purchase`,`bonus`,`consumption`,`refund`,`adjustment`), signed `amount`, `balance_after`, `feature` (nullable), `reference`, `meta` json, timestamps.
- `credit_packs` — admin CRUD: name, `credits`, `price_mad`, `is_active`, `sort`.
- `credit_purchases` — pack FK, store FK, credits, price, `status` enum (`pending`,`approved`,`rejected`), `receipt_path`, `reference`, `reviewed_by`, `reviewed_at`, `notes`.
- `CreditSetting` key-value model (mirror `HeroSetting`): `credits.welcome_bonus` (default 10), `credits.bank_details` (RIB text shown to sellers), `credits.cost.<feature>` per-feature price (defaults: listing_writer=2, store_creator=2, translate_listing=1, marketing_copy=1).
- `CreditService`: `walletFor(store)` (lazy-create), `charge(store, feature, meta)` — atomic `DB::transaction` + `lockForUpdate`, throws `InsufficientCreditsException` → HTTP 402 with balance+cost payload; `grant(...)`; `refundCharge(transaction)` when the AI call fails.
- Welcome bonus granted once per store (guard by existing `bonus` transaction) on wallet first-touch or store approval.

### AI tools (backend)

`SellerAiService` wrapping `AiManager->provider()->json(...)`; every endpoint: charge credits → call AI → refund on null/failure. Routes under `/api/seller/ai/*` (`auth:sanctum` + `role:store_owner`, throttle 10/min):

- `POST /api/seller/ai/listing` — `{product_name, category_id?, keywords?, locales[]}` → per-locale `{title, description, tags[]}`. Tone: Moroccan marketplace copywriter (reuse `AIDescriptionController` prompt DNA, Darija-aware).
- `POST /api/seller/ai/store-profile` — `{what_you_sell, city?, style?}` → `{name_ideas[], slogan, description, return_policy, shipping_policy}` (per requested locale).
- `POST /api/seller/ai/translate-listing` — `{name, description}` (or `product_id` owned by store) → all 5 locales (`ar`,`ma`,`fr`,`en`,`es`), `CategoryTranslationService` pattern.
- `POST /api/seller/ai/marketing` — `{product_id}` → `{whatsapp_message, social_caption}` with the product's public URL. Never includes seller phone (WhatsApp-never-checkout rule: traffic in, sale closes in-app).

### Credits API (backend)

- `GET /api/seller/credits` — balance, feature costs, recent transactions.
- `GET /api/seller/credits/packs` — active packs + bank details.
- `POST /api/seller/credits/purchase` — `pack_id` + `receipt` file (image/pdf ≤5MB, `PaymentProof` storage pattern) → pending purchase.
- `GET /api/seller/credits/purchases` — history with status.

### Admin (Blade, admin v3 components, super-admin)

- `/admin/credits` — pending purchase queue (view receipt → approve/reject; approve grants credits atomically + notifies seller), packs CRUD, settings (welcome bonus, bank details, per-feature costs), manual adjustment per store with reason.

### Frontend (Next.js 15, all 5 locales, RTL-aware, Atlas tokens)

- Seller layout header: credit balance chip → `/seller/credits`.
- `/seller/credits` — balance, pack cards → bank-details + receipt-upload purchase flow, purchase status, transaction history.
- Product create/edit form: "✨ Generate with AI (N credits)" fills title/description/tags; auto-translate button fills locale fields.
- Store settings + onboarding: AI generate for store description/slogan/policies.
- Seller products list: marketing-copy action (generate + copy WhatsApp text).
- Insufficient-credits (402) → upsell modal linking to `/seller/credits`.

## Out of scope (roadmap)

Pricing assistant, AI reply drafts in messages, Open Souk proposal writer, image
enhancement, online card top-up (activates when CMI/Stripe keys go live), credit
expiry, multi-currency.

## Non-functional

- Credit charge/refund must be race-safe (concurrent AI calls on one wallet).
- AI failure must never consume credits (refund path tested).
- Feature costs/bonus changeable by admin without deploy.
- Ledger is append-only; balance always equals ledger sum (test invariant).
