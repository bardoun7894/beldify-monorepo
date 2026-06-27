# Panel: Deployment Drift Fix Decision

## Question
Server running auto-improve branch instead of `main` — how to fix?

## R1: Claude Analysis
**Verdict:** Switch server to `main`, commit pending changes, fix deploy pipeline
**Confidence:** 0.95
**Key finding:** Server on `hermes/auto-improve/2026-06-23` → all committed fixes undelivered (P0 storefront, P1 null-safety 404, AI feature gate)
**Approach:** 3-step fix: (1) commit local pending, (2) switch server to main, (3) rebuild frontend image

## R2: Codex Analysis
**Verdict:** Branch mismatch is primary cause; auto-improve CI must rebase onto main
**Confidence:** 0.90
**Key finding:** No merge-back step in deploy pipeline — auto-improve works detached, deploy follows branch
**Approach:** Update deploy CI to checkout main, not auto-improve branch

## R3: Gemini Analysis
**Verdict:** Full stack fix needed — both backend and frontend server trees affected
**Confidence:** 0.88
**Key finding:** Locale files conflict risk (server has its own +114 lines vs local)
**Approach:** Preserve server locales by ensuring local versions match before deploy

## R4: OpenCode Analysis
**Verdict:** Simple branch switch + commit pending work
**Confidence:** 0.85
**Key finding:** The fix is straightforward — git operations, no complex refactoring
**Approach:** `git checkout main` on server, commit local, deploy

## Synthesis
**Consensus (4/4):** Branch mismatch is root cause. Fix: switch server to main, commit pending, fix pipeline.
**Adopted:** Full 3-step fix. Locale conflict resolved (local had same +114 lines).
**Decision rationale:** Unanimous — all four reviewers identified the same root cause.
