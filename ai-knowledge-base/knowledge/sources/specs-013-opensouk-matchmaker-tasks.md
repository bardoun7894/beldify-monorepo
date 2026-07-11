---
name: specs/013-opensouk-matchmaker/tasks.md
description: Auto-synced from specs/013-opensouk-matchmaker/tasks.md
type: source
sync_origin: specs/013-opensouk-matchmaker/tasks.md
sync_hash: 5fd6b086b2066c44
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/013-opensouk-matchmaker/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks: 013 — Open Souk AI Matchmaker + Proposal Assist

**Branch**: `feat/ai-opensouk-matchmaker` (both repos)
**Frontend worktree**: `/Users/mohamedbardouni/projects/beldify-ai3/beldify-frontend`
**Backend worktree**: `/Users/mohamedbardouni/projects/beldify-backend-ai3`
**Hard rule**: work ONLY in these two worktrees. NEVER touch the live trees or other feature worktrees.

## T1 — [backend-engineer] Two grounded endpoints  (P0)
- **A** `POST /api/seller/community/{post}/proposal-ai/draft` (seller-auth + suspended-guard) → `{available, pitch, suggested_price_range:{min,max}, suggested_delivery_days}`. Build prompt from `CommunityPost` (title/description/specifications) + seller store/vertical. **Strip phone/URL/contact** from pitch (reuse marketing-copy strip). 
- **B** `POST /api/community/posts/{post}/proposals/rank` (buyer-auth, **post-owner only → 403 otherwise**) → `{available, ranked:[{response_id, fit_score(0-100), summary}], overall_summary}`. Rank ONLY the post's real `PostResponse` rows (validate each `response_id` belongs to the post; drop hallucinations). Respect blind-bidding visibility (`[[beldify-opensouk-blind-bidding]]`).
- Provider: OpenRouter via `AiManager`. FREE. Malformed/AI-off → `{available:false}`; never throw; never alter existing propose/accept logic. Rate-limit both.
- TDD: A grounded in brief + contact-stripped; B owner-only (403 for non-owner), ranks only real responses, no leak, fallback. `php artisan test` green. Publish both JSON contracts for T2.

## T2 — [frontend-engineer] Two touchpoints + i18n  (P0; after T1) ✅ DONE
- [x] **A**: "Draft with AI" button in `ResponseForm.tsx` (via `ProposalAiDraft` component) → fills pitch/price/delivery fields; seller edits; never auto-submits.
- [x] **B**: `ProposalAiRanking` panel on buyer's brief detail page (`posts/[id]/page.tsx`) → ranked proposal list + overall summary, each linking to the real proposal. Owner-only visibility (renders null for non-owners).
- [x] `openSoukAiService.ts` — `draftProposal()` + `rankProposals()` direct-to-Laravel, no proxy.
- [x] `available:false` → hide gracefully (no list rendered, no error shown).
- [x] Atlas tokens, RTL, a11y (aria-live="polite", aria-label, roles).
- [x] i18n `opensoukAi.*` in ALL 7 locales (17 keys, exact parity).
- [x] TDD: 32 tests total (10 service + 10 ProposalAiDraft + 12 ProposalAiRanking), all GREEN. `npm run test` clean. Lint clean.

## T3 — [reviewer] Spec + contract + safety  (last)
- Diff vs FR1–FR6. Confirm: grounding (B ranks only real post responses, A only from brief/store), owner-only auth on B (no data leak), commission-safety (contact stripped), existing propose/accept untouched, contracts match frontend, Atlas/RTL/a11y/7-locale parity. Report P0–P3; no edits.

