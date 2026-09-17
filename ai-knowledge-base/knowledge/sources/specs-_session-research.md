---
name: specs/_session/research.md
description: Auto-synced from specs/_session/research.md
type: source
sync_origin: specs/_session/research.md
sync_hash: 9e5a1175e43ba6b4
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/_session/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Research — Drift Detection System (T002)

---

# Research — Per-Feature AI Provider Routing

## Context

Add per-feature AI provider routing to Beldify backend so lightweight features use OpenRouter free and paid features use DeepSeek.

## Design

- `config/ai.php`: Add `'provider'` field to feature entries. Features that use free OpenRouter: `buyer_assistant`, `buyer_ai`, `listing_ai`, `opensouk_matchmaker`. Features using default (DeepSeek): `seller_ai`, `product_description`. Flip default from `openrouter` to `deepseek`.
- `AiManager.php`: New `forFeature(string $featureKey): ChatClient` method reads provider override from config and resolves via existing `provider()` resolver.
- 5 service files: Inject `AiManager` instead of `ChatClient`, call `$this->ai->forFeature('feature_key')->json(...)`.

## Files Changed

| File | Change |
|---|---|
| `config/ai.php` | Add `provider` field to 4 features; flip default to `deepseek` |
| `AiManager.php` | Add `forFeature()` method |
| `ListingIntelligenceService.php` | `ChatClient` → `AiManager`; use `listing_ai` |
| `SellerAiService.php` | `ChatClient` → `AiManager`; use `seller_ai` |
| `BuyerAiService.php` | `ChatClient` → `AiManager`; `buyer_ai` (3 methods) + `buyer_assistant` (1 method) |
| `OpenSoukMatchmakerService.php` | `ChatClient` → `AiManager`; use `opensouk_matchmaker` |
| `AIDescriptionController.php` | Remove `ChatClient` dep; use `product_description` |

## KB Prior Art

### prod-local-git-drift ([[concepts/prod-local-git-drift]])

CSS cache-buster bumps applied directly on prod without committing cause divergence.
Example: `head.blade.php` had `?v=14` on prod that was never in git.
**Fix pattern**: catch-up commits before every deploy.
**Prevention**: use `?v={{ config('app.version') }}` pattern.

### PHP Opcache Pitfall ([[concepts/php-opcache-deployment-pitfall]])

After syncing code, PHP-FPM opcache pins old autoload classmap.
**Fix**: `docker restart beldify-backend` is required.

### Serwist SW Pitfalls ([[concepts/serwist-service-worker-pitfalls]])

`sw.js` is a generated PWA file that frequently conflicts during sync.
**Fix**: Auto-resolve with `--theirs` during pull.

### Docker Deployment ([[concepts/docker-deployment]])

Standard pattern: `git pull` on server via SSH.
Submodules need explicit `git submodule update --remote --merge`.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | Python 3 (stdlib) | No pip dependencies; SSH via subprocess |
| Output | Table with status cols | Human-readable, parseable |
| Conflict resolve | `--theirs` for sw.js only | Generated PWA file; others abort |
| Submodule sync | `git submodule update --remote --merge` | Standard upstream merge |
| Container restart | `docker restart beldify-backend` | Resets PHP opcache |
| `--quick` | SHA-only | ~2s per repo |
| `--fix` | Pull + resolve + submodule + restart | Idempotent |

## File

`scripts/drift-check.py` in project root.

