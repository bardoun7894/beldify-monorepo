---
name: Admin Panel Migration Decision (Atlas vs Filament)
description: "Three-reviewer panel verdict to finish the Atlas migration rather than pivot to Filament — Codex decisive evidence, Gemini dissent, and agreed first-action backlog"
type: concept
tags: [laravel, blade, migration, model, filament, tailwind, css, component, state, atlas]
sources: [daily/2026-05-21.md]
created: "2026-05-21"
updated: "2026-05-21"
---
# Admin Panel Migration Decision (Atlas vs Filament)

## Overview
During the afternoon session of 2026-05-21 (commit 1295f6ce), after unblocking the CSS/JS asset pipeline, a three-reviewer panel (Claude A, Codex B, Gemini C) evaluated whether to continue the Atlas Tailwind migration of the existing Beldify admin (~280 Blade views) or pivot to Filament 3, which would replace the entire admin surface with a Laravel-native component framework. The panel reached a clear majority verdict: **finish Atlas, do not introduce Filament**.

## Key Points
- **Verdict**: Continue Atlas migration; Filament pivot rejected for this codebase at this time
- **Decisive factor** (Codex): 120+ engineer-hours already spent on Atlas chrome + dashboard; switching now would abandon that investment and restart at equal or greater cost; the migration is ~15% complete with the hardest structural work (shared chrome, partials, RTL) already done
- **Dissent** (Gemini): Filament offers long-term developer velocity gains — typed resource classes, built-in CRUD, relation managers — worth considering once the current sprint stabilizes; not a flat rejection, more a "revisit post-Atlas" signal
- **Consensus first actions**: commissions correctness packet → orders cluster → community moderation; defer icon-swap (Line Awesome → Lucide) to the end of each cluster
- **Filament not permanently off the table**: the panel noted that Filament makes sense for new admin modules (e.g., a future Tailoring Management v2); the verdict is specifically against mid-migration pivot, not against Filament as a framework

## Details

### Panel composition and confidence scores
| Reviewer | Verdict | Confidence | Primary rationale |
|----------|---------|-----------|-------------------|
| Claude A | Finish Atlas | 85% | Sunk-cost + risk: two un-tested Filament-import paths exist (full swap vs selective); full swap requires test suite re-write; selective co-existence creates dual framework maintenance burden |
| Codex B | Finish Atlas | 90% | Surgical evidence: chrome layer already done + passing; commissions packet is the highest-ROI next step at ~4h; no single Filament resource eliminates more than one Blade view cluster in isolation |
| Gemini C | Filament (minority) | 60% | Filament 3 resource generators + relation managers eliminate boilerplate at scale; projected developer velocity +30% after initial onboarding cost; migration fatigue risk if Atlas path drags past two sprints |

### Weighted synthesis
Claude applied a 35/35/30 weighting (Claude / Codex / Gemini). Codex's surgical evidence carried the decision: the argument that "the hardest structural work is done and the remaining ~85% is mechanical" outweighed Gemini's velocity projection, which depends on assumptions about post-migration team ramp.

### Agreed execution plan
1. **Commissions correctness packet** (~4h) — replace `tw-primary-*` phantom tokens with Atlas indigo/amber tokens; static `match()` badge helpers in Commission model; kills 4 known JIT-purge spots
2. **Orders cluster** (~6h) — off-palette badge cleanup + thin Bootstrap wrapper removal; Atlas card components
3. **Community moderation** (~8h) — most visually jarring; blue→indigo gradient cards, `las` → Lucide icon swap, BS5 modals → Alpine.js dialogs
4. **Icon sweep** — deferred to end of each cluster (not a dedicated sprint)
5. **Filament review checkpoint** — after commissions + orders land: re-evaluate velocity metrics; if burn rate > 2× estimate, revisit Filament for remaining clusters

### The Filament-as-new-modules option (Gemini note)
Gemini's key contribution was separating two decisions: (a) "replace existing views with Filament" (rejected) vs (b) "build net-new admin modules in Filament from day one" (open). The panel agreed that new modules added after the Atlas migration completes should be built in Filament 3 by default, and the Atlas-built views should not be retrofitted.

## Related Concepts
- [[concepts/admin-atlas-migration]] — The migration being evaluated; its current state and first-action roadmap
- [[concepts/atlas-design-system]] — The design system both paths must express
- [[concepts/tailwind-jit-dynamic-class-pitfalls]] — Correctness bugs that motivated the commissions-first priority
- [[entities/laravel]] — Framework hosting both Atlas Blade views and any future Filament resources

## Sources
- [[daily/2026-05-21.md]] — Panel vote held in session 1295f6ce (afternoon) after APP_URL fix unblocked the admin dashboard; verdict documented here

## See also
- [[sources/panel-2026-05-21-admin-css-js-conflicts]]
