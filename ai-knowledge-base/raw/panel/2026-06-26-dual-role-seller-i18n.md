# Panel artifact — 2026-06-26 — Dual-role seller-buyer i18n polish

## Target

`specs/010-dual-role-seller-i18n/` — add 4 i18n keys (`navigation.seller_dashboard`, `seller.shortcut_title`, `seller.shortcut_body`, `seller.shortcut_cta`) to all 7 locale files; no logic changes; frontend already shipped + deployed.

## Risk classification

**Low / mechanical.** Pure i18n key-value addition. No architecture decisions, no API/DB/schema changes, no control-flow logic. The pre-approved plan (delivered in the `frontend-page` build-phase prompt) fully specifies strings for all 7 locales. Worst-case failure mode (malformed JSON) is caught by a programmatic `json.load` check before lint/build and would blank the app at module load — immediately obvious on smoke test.

## Panel verdict — tribunal not warranted

Running the full 4-agent panel (Claude + Codex + Gemini + OpenCode, 3 rounds with confidence scores) for 28 translation-key insertions that are already string-specified in an approved plan would burn ~40k tokens across four agents for zero decision lift. Per `panel` skill guidance ("Reserve for architecture decisions / pre-merge high-risk diffs"), this target is below the threshold.

**Consensus (skipped-ruling):** proceed directly to implementation. The spec triad (`spec.md` / `plan.md` / `tasks.md` under `specs/010-dual-role-seller-i18n/`) is the authoritative review artifact; the only load-bearing prior decision (DB is dual-role-clean by design — orders use `customer_id` + `store_id` as separate FKs) is already in KB project notes and unchanged here.

## Guardrails to honor during implementation

- Add keys to **all 7** locales — missing one silently triggers the `fallbackLng` chain and logs `missingKeyHandler` warnings. Add to all 7 to stay clean.
- `ma` values must be Darija, not MSA (precedent: `لوحة التحكم ديالي البايع`).
- Keep inline `defaultValue` fallbacks in TSX (Navbar.tsx, profile/page.tsx) — codebase-wide defensive pattern; do not remove.
- Run `json.load` validity check across all 7 files **before** lint/build — a stray comma breaks module load.
- `fr` `shortcut_cta` value is `Ouvrir le tableau de bord` (correct spelling — not "Ouvir" as mistyped in `plan.md`).

## Decision

**USER DECIDES → PROCEED (no tribunal).** Implement per `plan.md`, run lint + tsc + build:dev, then hand off to the deploy phase for dual-role session verification.
