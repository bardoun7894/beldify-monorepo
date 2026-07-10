---
name: specs/_session/ai-provider-routing/research.md
description: Auto-synced from specs/_session/ai-provider-routing/research.md
type: source
sync_origin: specs/_session/ai-provider-routing/research.md
sync_hash: 506bc78763509fb0
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/_session/ai-provider-routing/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Feature: Per-Feature AI Provider Routing

## Prior Art

No existing KB articles found on this topic. The task was defined in the original feature request and implementation plan.

## Files Analyzed

| File | Current State |
|------|---------------|
| `config/ai.php` | Features array has no `provider` field; default is `openrouter` |
| `AiManager.php` | Has `provider()` method but no `forFeature()` method |
| `ListingIntelligenceService.php` | Injects `ChatClient` directly |
| `SellerAiService.php` | Injects `ChatClient` directly |
| `BuyerAiService.php` | Injects `ChatClient` directly |
| `OpenSoukMatchmakerService.php` | Injects `ChatClient` directly |
| `AIDescriptionController.php` | Injects both `ChatClient` and `AiManager` |

## Plan Summary

1. Add `provider` field to 4 feature entries in `config/ai.php`; flip default to `deepseek`
2. Add `forFeature()` method to `AiManager.php`
3. Swap `ChatClient` → `AiManager` injection in 4 services + controller
4. Replace all `$this->client->json(...)` / `$this->client->chat(...)` with `$this->ai->forFeature('feature_key')->json(...)` / `->chat(...)`

## Feature → Provider Mapping

| Feature Key | Provider | Rationale |
|---|---|---|
| `buyer_assistant` | openrouter | Lightweight, high-traffic, conversational; free tier sufficient |
| `buyer_ai` | openrouter | Medium complexity, review summaries/search/size; free tier sufficient |
| `listing_ai` | openrouter | Lightweight listing analysis; free tier sufficient |
| `opensouk_matchmaker` | openrouter | Proposal drafting/ranking; free tier sufficient |
| `seller_ai` | default (deepseek) | Paid feature, higher quality needed for listing generation |
| `product_description` | default (deepseek) | Admin tool, higher quality needed for product descriptions |

