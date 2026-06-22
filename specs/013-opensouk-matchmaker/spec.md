# Spec: 013 — Open Souk AI Matchmaker + Proposal Assist

**Status**: Ready for build · **Branch**: `feat/ai-opensouk-matchmaker` · **Date**: 2026-06-14

## Problem
Open Souk (community marketplace): buyers post **briefs** (`CommunityPost`), ateliers submit **proposals** (`PostResponse`, blind-bidding — `[[beldify-opensouk-blind-bidding]]`). Two frictions: (1) sellers struggle to write competitive, well-priced proposals → low-quality bids; (2) buyers get many proposals and can't easily judge fit → slow/!no acceptance. Both depress Open Souk liquidity (the differentiator).

## Goal
Two grounded, commission-safe AI aids:
- **A. Seller proposal assist** — "Draft with AI" on the respond-to-brief form: from the brief + the seller's store/vertical, draft a proposal **pitch**, suggest a **price range** and **delivery-days** estimate. Seller edits + submits.
- **B. Buyer proposal ranking** — on the buyer's own brief detail: AI **ranks + summarizes** the received proposals (best-fit first, key differentiators) to speed acceptance.

## Functional requirements
- **FR1 (A)** — `POST /api/seller/community/{post}/proposal-ai/draft` → `{pitch, suggested_price_range:{min,max}, suggested_delivery_days}`. Seller-auth + suspended-guard. Grounded in the real `CommunityPost` (title/description/specifications) + the seller's store/vertical. **Commission-safe**: strip phone/URL/contact from the pitch (`[[beldify-whatsapp-never-checkout]]`); contact stays gated behind acceptance.
- **FR2 (B)** — `POST /api/community/posts/{post}/proposals/rank` → `{ranked:[{response_id, fit_score, summary}], overall_summary}`. Buyer-auth **and post-owner only** (must not leak another user's data; respect blind-bidding visibility — buyer sees all their post's responses). Ranks ONLY the post's real `PostResponse` rows (grounded; no invented proposals).
- **FR3** — **Grounding**: A draws only from the brief + store; B ranks only real `response_id`s that belong to the post. Never invent proposals, sellers, or prices outside the data.
- **FR4** — **Frontend**: (A) "Draft with AI" button on the seller respond-to-brief form → fills pitch/price/delivery fields, seller edits before submit (never auto-submits); (B) an "AI ranking" panel on the buyer's brief detail page → ranked proposal list + overall summary, linking to each real proposal. RTL, Atlas tokens, i18n 7 locales.
- **FR5** — **Provider/cost**: OpenRouter via `AiManager` (DB-backed). **v1 FREE** (drive Open Souk liquidity) — flagged as possibly credit-billed (seller side) later. AI off/no key → graceful degrade (button hidden / `available:false`).
- **FR6** — **Robustness**: malformed output → safe empty + non-blocking; never breaks the existing propose/accept flows (additive only). Rate-limit both endpoints.

## Non-functional / constraints
- Do NOT change the existing community propose/accept/visibility logic — additive assist only. Honor blind-bidding visibility rules exactly.
- Atlas tokens, a11y, mobile. `npm run test` (NEVER bare vitest) + `php artisan test` + lint + build green.
- Work ONLY in `/Users/mohamedbardouni/projects/beldify-ai3` (frontend) + `/Users/mohamedbardouni/projects/beldify-backend-ai3` (backend) worktrees.

## Scope (v1) / deferrals
- **v1 IN**: seller proposal draft (pitch+price+delivery); buyer proposal ranking+summary.
- **v1 OUT (v2)**: proactive atelier-matching notifications (notify best-fit sellers of a new brief), cross-brief seller reputation modeling, credit billing, auto-translate of proposals.

## Acceptance
- Seller "Draft with AI" returns a contact-free pitch + price range + delivery estimate grounded in the brief; seller edits + submits via the unchanged flow. Buyer ranking returns only the post's real proposals ranked with summaries, owner-only (403 for non-owners), no data leak. AI-off degrades gracefully; existing propose/accept untouched; tests/lint/build green.
