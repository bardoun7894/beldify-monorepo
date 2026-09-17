---
name: specs/011-darija-shopping-assistant/tasks.md
description: Auto-synced from specs/011-darija-shopping-assistant/tasks.md
type: source
sync_origin: specs/011-darija-shopping-assistant/tasks.md
sync_hash: c1804eb38b80722a
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/011-darija-shopping-assistant/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks: 011 — Darija Conversational Shopping Assistant

**Branch**: `feat/ai-suite-expansion` (both repos)
**Frontend worktree**: `/Users/mohamedbardouni/projects/beldify-ai/beldify-frontend`
**Backend worktree**: `/Users/mohamedbardouni/projects/beldify-backend-ai`
**Hard rule**: work ONLY in these two worktrees. NEVER touch `/Users/mohamedbardouni/projects/beldify` (live payouts), `/Users/mohamedbardouni/projects/beldify-hero`, or the nested live `beldify-backend` — other sessions own them.

NIU = 3: T1 (backend) → T2 (frontend, after T1 contract) ∥ partial overlap; T3 (QA) after; reviewer last.

## T1 — [backend-engineer] Assistant endpoint + grounded service  (P0)
- Add `POST /api/buyer-ai/assistant` (guest, throttled 20/min) to `BuyerAiController`; validate `{message≤500, history≤10, locale}`.
- `BuyerAiService::assistantTurn()`: system prompt (Darija-first, MAD, commission rule, `search_products` tool) → OpenRouter via `AiManager` → run `ProductSearchService` with the model's structured query → constrain model to recommend ONLY returned rows → return `{reply, products[hydrated server-side], suggestions[]}`.
- **Grounding**: products hydrated from search results, NEVER from model text. **Safety**: strip phone/URL/contact from reply (reuse marketing-copy phone-strip). **Fallback**: LLM error/empty → keyword `ProductSearchService` results + generic localized reply (never hard-fail). Honor global AI settings (no key → fallback path).
- TDD first: grounding, refusal+strip, fallback, rate-limit, ar/ma→Darija. `php artisan test` green. Report JSON contract for T2.

## T2 — [frontend-engineer] Assistant widget + i18n  (P0; after T1 contract)
- `assistantService.ts` + Next `/api/buyer-ai/assistant` proxy route (existing service/middleware pattern).
- `AssistantWidget.tsx`: floating launcher + chat panel (mobile bottom-sheet), message list w/ ARIA live region, input, suggestion chips, product cards via existing ProductCard → in-app PDP/cart links ONLY. RTL, Atlas tokens, `prefers-reduced-motion`. Lazy-load panel (dynamic import).
- Mount in storefront layout (guest-visible).
- i18n `assistant.*` keys in ALL 7 locales (en, ar, fr, es, ma, nl, de) — exact parity.
- TDD: render/launch, send, render cards+reply, RTL, a11y, chip click. `npm run test` (NEVER bare vitest) green; lint + `build:prod` clean.

## T3 — [qa-engineer] Suite green + grounding/commission assertions  (after T1/T2)
- Run full backend + frontend suites; report counts. Add cross-cutting assertions: no contact info leaks in replies; all product links are in-app; fallback works with AI disabled. Verify lint + build.

## T4 — [reviewer] Spec compliance + contract  (last)
- Diff vs spec FR1–FR7. Confirm grounding (products from search, not model text), commission-safety, Darija locale behavior, guest+rate-limit, /api/buyer-ai/assistant contract matches frontend. Report P0–P3; no edits.

