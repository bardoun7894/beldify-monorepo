---
name: specs/011-darija-shopping-assistant/spec.md
description: Auto-synced from specs/011-darija-shopping-assistant/spec.md
type: source
sync_origin: specs/011-darija-shopping-assistant/spec.md
sync_hash: 9fedd104e464d21f
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/011-darija-shopping-assistant/spec.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Spec: 011 — Darija Conversational Shopping Assistant

**Status**: Ready for build · **Branch**: `feat/ai-suite-expansion` · **Date**: 2026-06-14

## Problem
Buyers are mobile-heavy, Arabic/Darija-first, with varying literacy and a WhatsApp-conversational habit. Traditional search + filters underserve them. The existing NL-search assist is a one-shot parse, not a conversation. We want buyers to *ask* for what they want in Darija and be guided to real, in-stock products — closing the sale **in-app** (never via seller phone/WhatsApp, per `[[beldify-whatsapp-never-checkout]]`).

## Goal
An in-app **conversational shopping assistant** (Darija/Arabic primary; also fr/en/es) that understands a buyer's natural-language request, returns matching **real catalog products** (grounded — no hallucinated products), asks clarifying follow-ups, and links to PDP / cart / guest checkout. Free for buyers, guest-accessible, cost-bounded.

## Functional requirements
- **FR1** — Backend conversational endpoint: `POST /api/buyer-ai/assistant` `{message, history[], locale}` → `{reply, products[], suggestions[]}`. Extends `BuyerAiService` (not a new stack). Guest-accessible.
- **FR2** — **Grounded retrieval**: the assistant proposes a structured query (type, attributes, budget MAD, occasion), backend runs `ProductSearchService` against the live catalog (stocks), and the LLM may ONLY present products returned by search. No invented products, prices, or sellers. If nothing matches, it says so and offers alternatives/clarifying questions.
- **FR3** — **Darija-first** replies; respects request/UI locale (ar/ma → Darija/Arabic, else en/fr/es). Currency always MAD.
- **FR4** — **Frontend chat widget**: floating launcher on the storefront + expandable panel; RTL-correct; renders product cards (reuse existing ProductCard) linking to PDP; quick-reply suggestion chips. i18n chrome in all 7 locales.
- **FR5** — **Commission-safe**: never expose seller phone/WhatsApp/contact; never push the sale off-platform; always link to in-app PDP/checkout. Strip any contact info from model output.
- **FR6** — **Cost & abuse control**: rate-limit per session/IP (guest-safe); cap history length + token budget; graceful **fallback** to plain keyword search (existing NL/search path) when the LLM is unavailable or returns nothing useful.
- **FR7** — Uses the DB-backed AI provider (OpenRouter via `AiManager`); free for buyers (no credits). Honors the global AI on/off + provider settings.

## Non-functional / constraints
- Atlas tokens, mobile-first, a11y (keyboard, focus, ARIA live region for new messages, `prefers-reduced-motion`).
- `npm run test` (NEVER bare vitest, `[[beldify-vitest-dual-config-hazard]]`) green; backend `php artisan test` green; lint/build clean.
- All work in `/Users/mohamedbardouni/projects/beldify-ai` (frontend) + `/Users/mohamedbardouni/projects/beldify-backend-ai` (backend) worktrees only — never the live trees.

## Scope (v1) and explicit deferrals
- **v1 IN**: discovery (search + clarify + recommend), product cards → PDP, budget/occasion/attribute awareness, multi-turn context.
- **v1 OUT (v2)**: agentic cart mutation / checkout automation (v1 links only), voice input, order-status/support Q&A, personalization from history, paid tiers.

## Acceptance
- A Darija request (e.g. "بغيت قفطان أحمر للعرس تحت 1500 درهم") returns real in-stock matches as cards + a Darija reply + clarifying suggestion; an off-platform/contact request is refused; LLM-down falls back to keyword search; rate limit enforced; widget works on mobile + RTL; tests/lint/build green.

