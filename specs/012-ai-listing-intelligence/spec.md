# Spec: 012 — AI Listing Intelligence

**Status**: Ready for build · **Branch**: `feat/ai-listing-intelligence` · **Date**: 2026-06-14

## Problem
Catalog quality varies by seller: inconsistent categorization, sparse/missing attributes, low-quality or duplicate listings, and occasional off-platform contact in descriptions. At marketplace scale, catalog quality is the moat — and manual curation doesn't scale.

## Goal
On the seller product create/edit form, an **"Analyze with AI"** assistant that: suggests the right **category + vertical**, extracts structured **attributes**, gives a **quality score + actionable tips**, and **flags** likely-duplicate or policy-violating listings — all grounded in the *real* taxonomy. Seller reviews and applies; nothing is auto-saved without consent.

## Functional requirements
- **FR1** — Endpoint `POST /api/seller/listing-ai/analyze` `{title, description, category_id?, store_id}` → `{suggested_category, suggested_vertical, attributes[], quality_score, tips[], flags[]}`. Seller-auth + suspended-guard (reuse existing seller guards).
- **FR2** — **Grounded suggestions**: `suggested_category`/`suggested_vertical` constrained to EXISTING `categories` + store-type verticals (query the taxonomy; never invent a category). Attributes constrained to the vertical's known conditional-field set (`[[beldify-seller-verticals-jewelry]]`).
- **FR3** — **Quality score** 0–100 from title clarity, description completeness/length, attribute coverage, image presence → plus 2–3 concrete, localized improvement tips.
- **FR4** — **Flags**: (a) likely duplicate within the seller's own listings (title/attribute similarity); (b) policy violation — prohibited content or off-platform contact (phone/WhatsApp/URL) in title/description (commission rule `[[beldify-whatsapp-never-checkout]]`). Flags are advisory warnings, not hard blocks.
- **FR5** — **Frontend**: an "Analyze with AI" action on the seller product create/edit form → calls the endpoint → renders inline: apply-able category/vertical + attribute chips, a quality meter, tips list, and warning banners for flags. Seller applies selectively. RTL, Atlas tokens, i18n 7 locales.
- **FR6** — **Provider/cost**: OpenRouter via `AiManager` (DB-backed settings). **v1 = FREE** (platform cost) to maximize adoption and catalog quality — *flagged as a possible future credit-billed tool*. If AI is disabled/no key → graceful degrade (button hidden or returns a friendly "unavailable" with no error).
- **FR7** — **Fallback/robustness**: malformed model output → safe empty suggestions + non-blocking message; never breaks the product form save flow (which must keep working exactly as today).

## Non-functional / constraints
- Must NOT change the existing product create/edit save path/contract — this is additive assist only.
- Atlas tokens, a11y, mobile. `npm run test` (NEVER bare vitest) + `php artisan test` + lint + build all green.
- Work ONLY in `/Users/mohamedbardouni/projects/beldify-ai2` (frontend) + `/Users/mohamedbardouni/projects/beldify-backend-ai2` (backend) worktrees. Never the live/other-feature trees.

## Scope (v1) / deferrals
- **v1 IN**: category+vertical suggestion, attribute extraction, quality score+tips, within-seller dup flag, policy/contact flag, seller-applies UI.
- **v1 OUT (v2)**: cross-catalog dedup, image-based attribute extraction (vision), auto-translate of the listing (separate), credit billing, bulk/batch analyze.

## Acceptance
- Analyze returns a real category/vertical (never invented), structured attributes for the vertical, a 0–100 score + tips, and correctly flags an off-platform phone number + a near-duplicate of the seller's own listing. Seller can apply suggestions; the normal save still works untouched; AI-off degrades gracefully; tests/lint/build green.
