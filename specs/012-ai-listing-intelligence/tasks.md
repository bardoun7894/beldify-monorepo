# Tasks: 012 — AI Listing Intelligence

**Branch**: `feat/ai-listing-intelligence` (both repos)
**Frontend worktree**: `/Users/mohamedbardouni/projects/beldify-ai2/beldify-frontend`
**Backend worktree**: `/Users/mohamedbardouni/projects/beldify-backend-ai2`
**Hard rule**: work ONLY in these two worktrees. NEVER touch `/Users/mohamedbardouni/projects/beldify` (live), `/Users/mohamedbardouni/projects/beldify-hero`, `/Users/mohamedbardouni/projects/beldify-ai` (011 building), or the nested live `beldify-backend`.

NIU = 3: T1 (backend) → T2 (frontend, after contract) → T3 (QA) → T4 (review).

## T1 — [backend-engineer] Analyze endpoint + grounded service  (P0)
- `POST /api/seller/listing-ai/analyze` → `SellerListingAiController@analyze` (seller-auth + suspended-guard). Validate `{title≤200, description≤5000, category_id?, store_id}`.
- `ListingIntelligenceService`: load allowed `categories` + the store vertical's conditional-attribute schema → prompt OpenRouter via `AiManager` for category(from list only)/vertical/attributes(schema keys)/quality_score/tips → **validate output against taxonomy server-side** (drop invalid category/attr keys). Compute **flags server-side**: policy/contact (reuse phone-strip regex over title+desc) + within-seller duplicate (normalized title + key-attr similarity vs the store's active `stocks`).
- Robustness: malformed output or AI-off → `{available:false}` + empty suggestions; NEVER throw into the product flow. Do NOT modify existing product create/edit controllers.
- TDD first: grounding (category ∈ allowed, attrs ∈ schema), score 0–100, policy flag on embedded phone, dup flag on seeded near-dup, malformed/AI-off safe. `php artisan test` green. Publish JSON contract for T2.

## T2 — [frontend-engineer] "Analyze with AI" on the seller product form  (P0; after T1 contract)
- `listingAiService.ts` + Next `/api/seller/listing-ai/analyze` proxy.
- `ListingAiAssistant.tsx`: button on seller product create + edit pages → renders apply-able category/vertical + attribute chips, quality meter, tips, dup/policy warning banners. Seller applies selectively; never auto-submits; existing save logic UNCHANGED. `available:false` → hide button. RTL, Atlas tokens.
- i18n `listingAi.*` in ALL 7 locales (en, ar, fr, es, ma, nl, de) — exact parity.
- TDD: service call, render suggestions/score/tips/flags, apply-attribute updates form state, AI-off hides button, RTL + a11y. `npm run test` (NEVER bare vitest) green; lint + `build:prod` clean.

## T3 — [qa-engineer] Full gate + grounding/commission assertions  (after T1/T2)
- Run full backend + frontend suites; report counts. Assert: no invented categories/attributes; policy flag catches off-platform contact; existing product save path untouched; AI-off degrades. Verify lint + build.

## T4 — [reviewer] Spec compliance + contract  (last)
- Diff vs FR1–FR7. Confirm grounding (server-side taxonomy validation), server-side flags, no change to product save contract, /api/seller/listing-ai/analyze matches frontend. Report P0–P3; no edits.
