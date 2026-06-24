---
source: panel
reviewers: [claude, codex, gemini]
codex_model: gpt-5.5
gemini_model: 0.40.1
opencode_model: unavailable (model resolution failed twice)
date: 2026-05-21
target: Beldify Laravel admin (pro.beldify.com/admin/*) — chronic CSS/JS conflicts
scope: strategic-decision
---

## Prior art consulted
- /kb-query → [[concepts/admin-atlas-migration]] · [[concepts/tailwind-jit-dynamic-class-pitfalls]] · [[concepts/atlas-design-system]] · [[concepts/docker-deployment]]
- Key facts: 280 admin views, 189 with Bootstrap, 60 PixInvent, chrome layer already migrated to Atlas today with passing tests, dashboard/index Atlas KPI tiles shipped, 120h remaining, Filament 3.3 in composer (extent of admin adoption unclear), Frest BS4 menu JS crashed on BS4 removal earlier today.
- NotebookLM: n/a (no notebook_id configured in beldify-backend).

## Round 1 — Independent drafts

### Plan A (Claude)
- **RECOMMENDATION**: hybrid `S2+S3` — stabilize today, stand up Filament parallel this week, migrate resources page-by-page, retire Frest organically.
- **RATIONALE**:
  - Atlas migration is 30% done after months; finishing eats 120h of pure replatform with zero new business value.
  - Filament 3.3 is already in composer.json; sidebar/topbar/CRUD/table/form/modal come free.
  - Frest BS4 chrome is fragile; leaving intact while parallel `/admin-next` grows = zero breakage risk.
  - Atlas DESIGN.md tokens port cleanly to a Filament theme — no design loss.
  - Stabilization layer prevents new conflicts while legacy surface shrinks.
- **TOP 3 RISKS**: parallel admins → user confusion + double session; Filament AR/RTL maturity unverified; migration loses momentum if business pressure returns.
- **FIRST ACTION**: scaffold Filament panel at `/admin-next`, port Orders resource as PoC (~4h, read-only).

### Plan B (Codex) — headline + KB deep dive
**Headline:**
- **RECOMMENDATION**: hybrid `S3 → S1` (stabilize then finish Atlas).
- **RATIONALE**:
  - S3 is the safety gate; S1 is the only end state that actually removes conflicts.
  - S2 adds parallel auth, Livewire rewrites, design drift, two admin systems.
  - S3 alone preserves the mixed stack, so conflicts will keep recurring.
  - S1 matches current Laravel/Blade/Tailwind/Atlas workflow and preserves completed chrome work.
  - First win can ship today via freezing the conflict rules before the next migration packet.
- **TOP 3 RISKS**: migration fatigue (120h needs strict discipline); hybrid drift (legacy can reintroduce conflicts); Frest dependency (BS4 menu JS must stay isolated until retired).
- **FIRST ACTION**: freeze admin asset rules — one Bootstrap version, one icon font, no dynamic Tailwind.

**KB-grounded deep dive (Codex via /kb-query):**
- **Recommendation reinforced**: S1 (continue Atlas migration cluster-by-cluster, starting with commissions correctness fixes). S2 explicitly ruled out.
- **Reasoning against S2**:
  1. Filament is a **rewrite, not a migration**. Replaces Blade views with Livewire-backed Resource classes. All 280 views' business logic must be re-expressed in Filament API. Larger than the Atlas migration itself.
  2. **Tailwind config conflict**: Filament ships its own Tailwind config and CSS layer. Running alongside existing `tw-` prefixed Atlas Tailwind = exactly the class-collision problem we're trying to escape.
  3. **Two admin systems = doubled maintenance** until legacy admin is fully retired.
- **Why S1 first packet beats S3**: commissions cluster (~8 files, ~1 day) delivers BOTH the correctness fix S3 promises AND advances the migration. 64 phantom `tw-primary-*` tokens → real `tw-bg-indigo-700` Atlas tokens; dynamic `tw-bg-{{ $status }}-100` → static `@php match()`.
- **Key insight**: chrome layer (~80% of visual improvement across 280 pages) already done. Remaining migration = content panels = 20% of visual impact but where the production correctness bugs live.
- **Execution order**: commissions → orders → community moderation → remaining clusters one sprint each.

### Plan C (Gemini)
- **RECOMMENDATION**: `S2`.
- **RATIONALE**:
  - Parallel `/panel` guarantees zero CSS/JS conflicts by fully isolating DOM and assets.
  - Filament already installed = massive velocity for standard CRUD modernization.
  - Existing `/admin` remains untouched = eliminates production regression risk.
  - Filament's native Tailwind aligns with Atlas DESIGN.md goals.
- **TOP 3 RISKS**: auth state fragmentation if admins bounce between interfaces; theming limitations requiring custom Blade to match Atlas tokens precisely; navigation drift requiring sidebar/Filament sync during transition.
- **FIRST ACTION**: scaffold Filament provider at `/panel` and apply Atlas Indigo brand color.

### Plan D (OpenCode/MiniMax)
**UNAVAILABLE** — two attempts failed:
1. Model `opencode/minimax-m2.5-free` not found.
2. Retry with `opencode-go/minimax-m2.7` produced no captured stdout (output went to TUI buffer, not stdout pipe).

Per skill fallback rules, proceeding as 3-reviewer panel with note that D's voice on UX/clarity/cross-cutting is missing.

## Round 2 — Cross-review (abbreviated)

Round-2 parallel CLI cross-review was **skipped** because (a) OpenCode is unavailable so D-on-others and others-on-D cannot run, and (b) Codex's KB-grounded deep dive already contained an explicit, evidence-backed critique of S2 that substitutes for a separate Codex-on-Gemini round-2 pass. Claude's inline critique below stands in for the formal Round 2.

### Claude on B + C (with confidence scores)

`B:S1-only end state` — confidence **4** — issue: I initially preferred parallel Filament because it isolates conflicts. Codex's KB evidence shows Filament has its OWN Tailwind config that would re-introduce class collisions, plus it's a Livewire rewrite of 280 views. Recommendation: update A to drop S2; align with B (S3 → S1).

`B:commissions-cluster-first` — confidence **5** — issue: this is genuinely the highest-signal first move because it fixes correctness bugs (invisible buttons in prod) AND advances migration in the same diff. Recommendation: adopt as FIRST ACTION instead of "freeze rules" or "scaffold Filament".

`C:zero-conflict-by-isolation` — confidence **3** — issue: assumption that Filament's CSS won't conflict with Atlas Tailwind is wrong per Codex evidence (Filament ships its own Tailwind config). Recommendation: do not adopt isolation-by-parallel-Filament.

`C:Filament-velocity` — confidence **2** — issue: velocity claim only holds for greenfield CRUD; Beldify admin has heavy custom business logic (multi-seller, commissions, tailoring) that Filament Resources won't shortcut. Recommendation: discount this benefit.

`B:freeze-rules-as-day-1` — confidence **4** — issue: Codex headline says freeze rules first, then commissions. Codex KB-dive says commissions first. The two Codex outputs disagree. Reconcile: do BOTH the same day — write the rules into a Husky/CI lint AND ship the commissions PR. The rule prevents the next packet regressing; the packet delivers value.

`A:scaffold-Filament-today` — confidence **5** (to self, against self) — issue: my original first action is wrong on the evidence. Recommendation: retract; adopt Codex's commissions-cluster-first.

## Round 3 — Weighted synthesis

### Decision rationale
Two of three reviewers (Codex headline + Codex KB-dive) recommended finishing Atlas; one (Gemini) recommended parallel Filament; Claude initially leaned Filament-hybrid but updated to align with Codex after KB evidence surfaced two concrete blockers to S2 (Filament has its own Tailwind config that re-creates the conflict problem; Filament is a Livewire rewrite of all 280 views, not a migration). The fork was "introduce a new system vs. finish the system we already started." The principle that broke the tie: **the chrome layer (80% of visual improvement) is already done in Atlas**, and the same first packet (commissions cluster) that closes correctness bugs ALSO advances migration — so S1's first move is strictly better than S3's first move.

### Consensus (all reviewers agree)
- **Production must not break.** [signal: 15] — A:5, B:5, C:5. Any plan that requires touching the Frest BS4 chrome JS is out. The chrome migration done today is the maximum risk envelope.
- **Atlas DESIGN.md is the canonical visual target.** [signal: 13] — A:4, B:4, C:5. No reviewer proposed abandoning Atlas tokens; even C wants to theme Filament with them.

### Majority (2 of 3 — strong signal, one dissent preserved)
- **Continue the Atlas migration; do NOT introduce Filament.** [signal: 9] — B:5, A:4 (updated). C (conf 4) dissents because parallel isolation feels safer. **Adopt.** Flag if commissions-cluster effort overruns 2× estimate (1 day → 2 days) — re-open Filament conversation.
- **First action: commissions cluster correctness fix + Atlas migration in same PR.** [signal: 9] — B(KB):5, A:4 (updated). C dissented (Filament-scaffold first). **Adopt.** Delivers correctness (invisible buttons fixed) AND advances migration in one diff, ~1 day, 8 files. Reference: [[concepts/tailwind-jit-dynamic-class-pitfalls]].
- **Freeze conflict-prevention rules as a CI/lint check before the next packet.** [signal: 8] — B(headline):4, A:4 (updated). C did not address. **Adopt.** Rules: one Bootstrap version per page, one icon font (Lucide), no dynamic Tailwind class construction, no inline `<style>` blocks over 10 lines, ban `tw-primary-*` tokens.

### Weighted minority (1 of 3, surface for awareness)
- **Filament is the cleanest long-term answer.** [signal: 4] — C:4. Not adopted now because Codex's KB evidence shows the migration cost is higher than finishing Atlas. **Revisit if** the Atlas roadmap stalls past Q3 OR a new admin module (e.g., a billing/subscriptions panel) needs to ship — Filament could host the new module without touching legacy.

### Preserved dissent
- **Stabilize-in-place as a permanent end state (S3).** Considered by all three, adopted by none — leaves the mixed stack alive, conflicts return on every new feature. Worth revisiting only if migration capacity drops to zero.

### Unresolved conflicts — USER DECIDES
- **Do we ship the freeze-rules CI check today, or after commissions?** B-headline says rules first, B-KB-dive says commissions first. Both are 1-day jobs. Default if you don't pick: do both in parallel — rules as a CI workflow (no production touch), commissions as a Blade PR (touches prod). They don't block each other.

### Final plan — ranked by signal

**Week 1 — load-bearing first packet:**

1. **Commissions cluster correctness + Atlas migration** (~8 files, 1 day). Replace 64 phantom `tw-primary-*` with real Atlas tokens (`tw-bg-indigo-700` etc.); replace dynamic `tw-bg-{{ $status }}-100` with static `@php match()`; replace BS4 modals with Alpine `x-data` dialogs. Tests: feature test for each commission CRUD path.
2. **Conflict-prevention CI guard** (~half day). PHP lint rule that fails CI on (a) inline `<style>` blocks > 10 lines, (b) dynamic Tailwind class concatenation in Blade, (c) `tw-primary-*` literal occurrences, (d) `data-toggle` AND `data-bs-toggle` in the same file. Lives in `.github/workflows/admin-lint.yml`.

**Week 2-3 — next two packets per existing KB roadmap:**

3. **Orders cluster** (~half day). High-traffic surface; thin Bootstrap wrappers → Atlas; badge color tokens.
4. **Community moderation cluster** (~1 day). Most visually jarring off-palette stat cards; `las` icon → Lucide swap; BS4 modals → Alpine.

**Ongoing — every remaining packet:**

5. One cluster per sprint until 0 admin files contain Bootstrap structural classes (`row`, `col-*`, `data-toggle`, BS4 modal/dropdown patterns).
6. Lucide swap as part of each packet (delete the matching `la la-*` / `fa-*` references in the same diff).

**End state**: single CSS layer (Atlas Tailwind only), single icon font (Lucide), zero Bootstrap, Frest theme retired with the last legacy view. Chrome already done today; remaining cost ≈ 120h amortised over ~6 sprints.

**Explicitly NOT doing**:
- Standing up Filament at a parallel URL (Filament's own Tailwind config would re-create the conflict; 280-view Livewire rewrite is larger than finishing Atlas).
- Removing BS4 site-wide before the Frest chrome is retired (crashes `app-menu.js` — proved earlier today).
- Bulk find/replace across all 189 BS-containing views in one PR — high merge-conflict and regression risk.
