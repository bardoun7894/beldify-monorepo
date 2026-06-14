# Plan: 012 — AI Listing Intelligence

## Backend (`/Users/mohamedbardouni/projects/beldify-backend-ai2`)
- **Endpoint**: `POST /api/seller/listing-ai/analyze` → new `SellerListingAiController@analyze` (seller-auth + suspended-guard, reuse existing middleware). Validate `{title≤200, description≤5000, category_id?:exists, store_id}`.
- **Service**: `App/Services/Ai/ListingIntelligenceService` (or extend `SellerAiService`):
  1. Load grounding context: existing `categories` (id+localized name tree) + the store's vertical/store-type conditional-attribute schema (`[[beldify-seller-verticals-jewelry]]`).
  2. Prompt `AiManager`/`ChatClient->json()` (OpenRouter) with title/description + the ALLOWED category list + the vertical attribute schema → ask for `{category_id (from list only), vertical, attributes{schema keys}, quality_score, tips[]}`.
  3. **Validate model output against the taxonomy**: drop any category_id not in the allowed list, any attribute key not in the schema (grounding guarantee, server-side).
  4. **Flags** computed server-side (not trusted to model): policy flag via the existing phone/URL/contact regex (reuse marketing-copy strip helper) over title+description; dup flag via similarity (normalized title + key attributes) against the seller's own active listings (`stocks`).
  5. Return `{suggested_category, suggested_vertical, attributes[], quality_score, tips[], flags[]}`.
- **Robustness**: malformed JSON → return empty suggestions + `available:false`-style message; never throw into the product form flow. AI disabled/no key → `available:false`.
- **No change** to the existing product create/edit controllers/contract — additive only.

## Frontend (`/Users/mohamedbardouni/projects/beldify-ai2/beldify-frontend`)
- **Service**: `src/services/listingAiService.ts` + Next `/api/seller/listing-ai/analyze` proxy route (existing service/middleware pattern).
- **Component**: `src/components/seller/ListingAiAssistant.tsx` — "Analyze with AI" button on the product create/edit form; on click → calls endpoint → renders: apply-able category/vertical suggestion, attribute chips (click to apply into the form fields), a quality meter (0–100), tips list, and warning banners for dup/policy flags. Seller applies selectively; never auto-submits. RTL, Atlas tokens, `prefers-reduced-motion`.
- **Integration**: mount inside the existing seller product create + edit pages WITHOUT altering their save logic. If `available:false`, hide/disable the button gracefully.
- **i18n**: `listingAi.*` keys in all 7 locales (en, ar, fr, es, ma, nl, de), exact parity.

## Testing (TDD)
- Backend: suggestions constrained to real categories/attributes (feed a title, assert returned category_id ∈ allowed set); attribute keys ∈ vertical schema; quality_score in 0–100; policy flag fires on an embedded phone number; dup flag fires against a seeded near-duplicate; malformed-output + AI-off → safe empty. `php artisan test`.
- Frontend: button calls service, renders suggestions/score/tips/flags, apply-attribute updates form state, AI-off hides button, RTL + a11y. `npm run test`.

## Risks / guards
- **Grounding** (#1): category/attribute outputs validated against the real taxonomy server-side; flags computed server-side, not trusted to the model.
- **Don't break product save**: assist is purely additive; assert the existing save path is untouched.
- Commission rule: policy flag reuses the contact-strip regex.
- Isolation: only the two `*-ai2` worktrees.
