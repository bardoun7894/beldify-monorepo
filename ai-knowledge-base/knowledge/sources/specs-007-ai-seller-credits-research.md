---
name: specs/007-ai-seller-credits/research.md
description: Auto-synced from specs/007-ai-seller-credits/research.md
type: source
sync_origin: specs/007-ai-seller-credits/research.md
sync_hash: 371c1e0714bf7038
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/007-ai-seller-credits/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Research: ai-seller-credits

**Generated**: 2026-06-10
**Feature**: [spec.md](./spec.md)

<!-- Sections below are populated by /kb-spec <mode> before each Spec Kit phase. -->

## Prior art from KB

*Queried at 2026-06-10T19:08 · Mode: pre · Question: "What do we know about Beldify's AI infrastructure (AiManager, OpenRouter, product description generation, category auto-translate), and is there any existing seller wallet, credits, payments, or billing system for sellers?"*

### AI Infrastructure

- [[beldify-ai-openrouter]] — OpenAI key dead (401); product-desc + category-translate moved to `config('services.openrouter')`, model `openrouter/free`. New env var needs **container recreate** ([[concepts/docker-env-file-recreation]]).
- [[beldify-ai-settings-db-backed]] — `AiManager` overlays DB-backed settings over config; admin UI (`/{locale}/admin/ai-settings`) manages provider + encrypted API keys (OpenRouter/OpenAI/DeepSeek/Gemini). Built to avoid the env-recreate cycle.
- [[beldify-category-autotranslate]] — on category save, fr/es/ma name/desc auto-translation via OpenRouter.

### Code map (verified 2026-06-10 by Explore agent)

- `AiManager` — `beldify-backend/app/Services/Ai/AiManager.php` (provider resolution, DB overlay, encrypted `ai_settings` keys).
- `ChatClient` contract — `app/Services/Ai/Contracts/ChatClient.php` (`chat()`, `json()`); impl `OpenAiCompatibleClient.php` with fallback-model retry.
- Existing AI endpoint — `POST /api/generate-description` → `app/Http/Controllers/Admin/AIDescriptionController.php` (Darija copywriter prompt, gendered fallback templates). **No seller UI calls it.**
- `CategoryTranslationService` — `app/Services/CategoryTranslationService.php` (fills missing locales, `saveQuietly()`).

### Seller wallet / billing

- **No wallet/credit/balance/subscription system exists** (migrations + models swept).
- Payment gateway foundation EXISTS, dormant: `app/Services/Payments/PaymentGatewayManager.php` + Stripe/CMI drivers, `payment_settings` encrypted key-value, default-off (`payment.{name}.enabled`), routes `/api/payments/*`.
- Bank-transfer receipt flow LIVE: `POST /api/orders/{orderNumber}/payment-proof` → `PaymentProofController`, `PaymentProof` model (status pending/verified/rejected, verified_by), 5MB image/pdf. **Template for credit purchases.**
- Commission accounting split-brain ([[sources/2026-06-10-backlog-make-later]]) — `CommissionService` vs `CommissionAccountingService` divergence. Credits ledger is INDEPENDENT of that decision; do not couple.

### Seller surface

- Seller API: `/api/seller/*` in `routes/api.php` (~366-398), `auth:sanctum` + `role:store_owner` ([[beldify-seller-role-model]] — `store_owner` canonical).
- Seller pages: `beldify-frontend/src/app/seller/{page,products/new,products/[id]/edit,store-settings,onboarding,...}`.
- Settings pattern to mirror: `HeroSetting` (plain) / `AiSetting`,`PaymentSetting` (encrypted) — key-value + per-request cache + `getValue/setValue`.

### Constraints carried forward

- [[beldify-whatsapp-never-checkout]] — marketing copy shares product links; never seller phone; sale closes in-app.
- [[beldify-nested-backend-git-repo]] — backend is its own repo; branch + commit both repos separately.
- [[parallel-agents-shared-tree-stash-hazard]] — NEVER `git stash` in shared tree; stage only own paths. Backend tree currently dirty with concurrent-session community/commission files.
- [[beldify-local-docker-mirror]] / sync-local.sh — backend Blade changes need `bash sync-local.sh` from repo root + opcache restart.
- [[beldify-i18n-architecture]] — 5 locales (ar, ma, fr, en, es), Darija default.

