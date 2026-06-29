# Orchestrator dispatch log — 2026-06-28 — Per-Feature AI Provider Routing

## Orchestrator (PM) — role classification

- **Packet classification:** mechanical (7 files, well-defined edits, pre-approved plan from prior phase, no logic/architecture/DB/API changes — all 7 edits follow the same pattern: add `forFeature()` wrapper + swap constructor injection).
- **Per AGENTS.md Step 3b trivial-fix carve-out:** mechanical single-concern work may skip orchestrator fan-out. This file IS the orchestration log.

## Role assignments (standup)

| Role | Agent | Assignment this phase | Status |
|---|---|---|---|
| Orchestrator / PM | deepseek-v4-flash (this session) | Gate compliance, task logging, phase output | active |
| Backend (inline) | deepseek-v4-flash (this session) | Execute 7 file edits per plan | ready |
| QA | — | `php artisan test` after edits | pending |

## Execution mode

Inline single-session (Backend role) — no parallel fan-out warranted. Single mechanical concern: 7 file edits following the exact same structural pattern.

Subagent dispatch unavailable in this harness (no teams/subagent tool exposed). Equivalent: explicit role-standup above + direct execution.

## Implementation plan

| # | File | Change summary |
|---|---|---|
| 1 | config/ai.php | Flip default → `deepseek`; add `'provider' => 'openrouter'` to `buyer_assistant`, `buyer_ai`, `listing_ai`, `opensouk_matchmaker` |
| 2 | AiManager.php | Add `forFeature(string $featureKey): ChatClient` method |
| 3 | ListingIntelligenceService.php | Inject `AiManager`, use `listing_ai` feature |
| 4 | SellerAiService.php | Inject `AiManager`, use `seller_ai` feature |
| 5 | BuyerAiService.php | Inject `AiManager`, use `buyer_ai` (3 methods) + `buyer_assistant` (1 method) |
| 6 | OpenSoukMatchmakerService.php | Inject `AiManager`, use `opensouk_matchmaker` feature |
| 7 | AIDescriptionController.php | Remove `ChatClient`, use `product_description` feature |
| 8 | Verify | `php artisan test` to confirm no regressions |
