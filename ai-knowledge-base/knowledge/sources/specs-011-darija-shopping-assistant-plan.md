---
name: specs/011-darija-shopping-assistant/plan.md
description: Auto-synced from specs/011-darija-shopping-assistant/plan.md
type: source
sync_origin: specs/011-darija-shopping-assistant/plan.md
sync_hash: fda54f2c237667fc
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/011-darija-shopping-assistant/plan.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Plan: 011 — Darija Conversational Shopping Assistant

## Backend (`/Users/mohamedbardouni/projects/beldify-backend-ai`)
- **Endpoint**: add `assistant(Request)` to `App/Http/Controllers/API/BuyerAiController.php` → `POST /api/buyer-ai/assistant` (public/guest, throttled). Validate `{message:string max 500, history:array max 10, locale:in supported}`.
- **Service**: `BuyerAiService::assistantTurn(message, history, locale)`:
  1. Build a system prompt: Darija-first persona, marketplace context, MAD, commission rule (never expose contact / off-platform), and a single **tool** contract `search_products(query, attributes, min_price, max_price, occasion)`.
  2. Call `AiManager`/`ChatClient->json()` (OpenRouter) → if it returns a structured `search_products` call, run **`ProductSearchService`** with those params (live catalog/stocks; respect content-locale rule).
  3. Feed the real result rows back to the model constrained to "recommend ONLY these"; get a final Darija `reply` + chosen product ids + `suggestions[]` (quick replies).
  4. Return `{reply, products: <hydrated cards: id,name,price,image,slug>, suggestions}`. Hydrate products server-side from search results (never from model text) → **grounding guarantee**.
- **Safety**: post-filter the reply to strip phone/URL/contact patterns (reuse the marketing-copy phone-strip helper). 
- **Fallback**: on LLM error/empty → return `ProductSearchService` keyword results for `message` + a generic localized reply (feature never hard-fails).
- **Rate limit**: `throttle` middleware keyed by session/IP (e.g. 20/min). Cap history to last 10 turns.
- **Cost**: free; OpenRouter via AiManager; honor `ai.provider`/global AI settings (if no key set → fallback keyword path, no error).

## Frontend (`/Users/mohamedbardouni/projects/beldify-ai/beldify-frontend`)
- **Service**: `src/services/assistantService.ts` → POST to a Next.js `/api/buyer-ai/assistant` route handler that proxies the Laravel endpoint (matches existing service-layer + CSRF/rate-limit middleware pattern).
- **Component**: `src/components/assistant/AssistantWidget.tsx` — floating launcher (lucide `MessageCircle`/`Sparkles`) + chat panel; message list with ARIA live region; input; suggestion chips; renders `products[]` via the existing ProductCard; all links → in-app PDP/cart. RTL-correct, Atlas tokens, mobile bottom-sheet on small screens, `prefers-reduced-motion`.
- **Mount**: storefront layout (guest-visible). Lazy-load the panel (dynamic import) to protect bundle/LCP (`[[vercel-react-best-practices]]`).
- **i18n**: chrome keys (`assistant.*`: launcher label, placeholder, empty state, error, "view product") in all 7 locales (en, ar, fr, es, ma, nl, de) — exact parity.

## Testing (TDD)
- Backend: `assistantTurn` returns ONLY real catalog products (grounding); off-platform/contact request refused + stripped; fallback to keyword search when LLM null; rate-limit; locale → Darija for ar/ma. `php artisan test`.
- Frontend: widget renders/launches, sends message, shows product cards + reply, RTL, a11y live region, suggestion-chip click. `npm run test`.

## Risks / guards
- **Grounding** is the #1 correctness risk → products ALWAYS hydrated from `ProductSearchService`, never parsed from model text.
- Token/cost → history cap + rate limit + token budget.
- Commission rule → contact-strip post-filter + in-app-only links (assert in tests).
- Isolation → only the two AI-program worktrees.

