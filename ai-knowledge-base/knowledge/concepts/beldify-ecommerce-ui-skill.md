---
name: beldify-ecommerce-ui Skill
description: Custom Claude Code skill enforcing Atlas design + frontend-engineer/impeccable/gemini toolchain for all Beldify UI changes — stored at .claude/skills/beldify-ecommerce-ui/SKILL.md; first real execution on 2026-06-02 covering 7 surfaces
type: concept
tags: [laravel, php, blade, artisan, migration, route, tailwind, css, html, query]
sources: [daily/2026-05-31.md, daily/2026-06-02.md]
created: "2026-05-31"
updated: "2026-06-02"
---
# beldify-ecommerce-ui Skill

## Overview
The `beldify-ecommerce-ui` skill is a custom Claude Code skill (SKILL.md) at `.claude/skills/beldify-ecommerce-ui/SKILL.md` that serves as the single entry point for any Beldify e-commerce UI change. It enforces two things on every invocation: (1) design fidelity against the Atlas system + Stitch references, and (2) role discipline through a mandatory orchestrator fan-out pattern.

## Key Points
- **Source of truth**: reads `stitch_beldify_arabic_seller_dashboard/screen.png` + `DESIGN.md` before any UI work
- **Design tokens**: pins exact Atlas values — Primary `#252555` indigo (deep), Accent `#fea619` saffron amber, Surface `#fbf9f4` parchment, ink `#1b1c19`; font IBM Plex Sans Arabic; RTL-first; MAD currency
- **Stack reality**: seller/admin = Laravel Blade + v3 components; storefront = Next.js; Stitch output = visual reference only, never dropped as raw HTML
- **Toolchain** (fixed, mandatory): `frontend-engineer` → `impeccable` → `gemini` (design critique vs Atlas + screen.png) → `verification-before-completion`
- **Mobile + desktop**: both must be verified independently (mobile-width AND desktop-width screenshots); mobile = 2-up grids, fixed bottom tab nav, iOS safe-area; desktop = 12-col grid, 3–4-up, pill nav, table over stacked cards

## Details

### Execution model
Every invocation must follow:
1. `/kb-spec log` before any work
2. `/kb-query` for prior art
3. Orchestrator fans out: `frontend-engineer` (UI) + `backend-engineer` (logic/data) + `qa-engineer` (tests + i18n) + `reviewer` (contract + token compliance)
4. `frontend-engineer` runs `impeccable` for UI quality
5. `gemini` critiques the result against `screen.png` + Atlas tokens (design review, RTL check)
6. Loop back if critique finds issues
7. `verification-before-completion` with both mobile + desktop `ar` screenshots

### Design token note
The skill initially specified `#252555` as the primary indigo, which conflicts with the authoritative root `DESIGN.md` value of `#4338ca`. When invoking the skill, the root `DESIGN.md` takes precedence — the skill itself acknowledges Stitch output is "reference only, port to Atlas tokens" and DESIGN.md is where those live. This resolved a palette-drift risk on the seller dashboard KPI polish.

### Per-surface checklist
Frontend-engineer must cover:
- Matches `screen.png` layout and Atlas tokens (no off-palette colors)
- RTL correct: mirrored layout, logical properties, Arabic copy via `__('messages.*')` (Blade) or i18n keys (Next.js)
- Money in MAD/درهم; numbers localized
- Reuses v3 components — no duplicated markup
- Empty/loading/error states present
- Mobile: 2-up KPI grid + bottom tab bar; desktop: pill nav
- a11y: focus rings, aria-labels, contrast ≥ AA

## First real execution — 2026-06-02 (session bdb93bad)

The skill's first full invocation covered 7 surfaces: landing page, PDP, cart, artisan shop listing, product listing, tailoring measurements (new route), and seller dashboard (backend Blade).

### What the toolchain caught
- **Palette drift**: Workers independently reached for `#6366f1` (Tailwind violet) instead of Atlas `#252555`/`#3b3b6d`. Gemini design critique identified this as a systematic off-Atlas-palette error across 4 files.
- **CSS build failure**: Two PostCSS build errors (CSS comment premature-close, arbitrary-value slash) masked by passing vitest string tests. Only caught when the dev server returned HTTP 500. The skill's "run dev server + take HTTP screenshot" step caught what vitest missed.
- **Off-palette gradients**: Green cart CTA gradient and purple measurement form gradient replaced via P0 sweep after gemini critique flagged them.

### Pitfalls learned from first execution
1. **Vitest string tests are not CSS build verification.** Always run `npx tailwindcss -i src/app/globals.css -o /tmp/tw.css` before claiming CSS is green.
2. **Workers must diff DESIGN.md for exact hex values.** Named Tailwind colors (`indigo-500` = `#6366f1`) are NOT Atlas colors (`#252555`).
3. **Stitch screen references must be applied structurally, not cosmetically.** The seller dashboard port required reading the Stitch IA (H1 → KPI row → table → chart) and applying it to the Blade template, not just changing CSS colors.
4. **sync-local.sh must run from monorepo root**, not from inside `beldify-backend/`. Running from the wrong directory gives "No such file or directory" and the container keeps serving the old view.

### Seller dashboard port (Blade)
The seller shell layout (`seller_shell.blade.php`) had its Google Fonts URL updated from Inter to IBM Plex Sans Arabic. The dashboard itself (`seller/dashboard.blade.php`) was restructured to match the Stitch IA:
- نظرة عامة H1 heading
- 3-up KPI row (GMV / Orders / Revenue)
- الطلبات الأخيرة table
- أداء المبيعات chart
- Duplicate "Today Snapshot" section (line 580) removed

## Related Concepts
- [[concepts/atlas-design-system]] — the design system this skill enforces
- [[concepts/stitch-design-generation]] — Stitch MCP used as the visual reference source
- [[concepts/dual-mode-seller-dashboard]] — primary seller surface the skill was first applied to
- [[concepts/atlas-frontend-migration]] — Phase 5 execution driven by the skill
- [[concepts/tailwind-css-comment-premature-close]] — pitfall discovered during first execution
- [[concepts/tailwind-arbitrary-value-slash-pitfall]] — pitfall discovered during first execution
- [[concepts/seller-shell-layout]] — seller backend surface ported in same session

## Sources
- [[daily/2026-05-31.md]] — Skill created in `.claude/skills/beldify-ecommerce-ui/SKILL.md`; toolchain fixed to `frontend-engineer → impeccable → gemini → verify`; mobile + desktop deliverables added; palette conflict resolved in favor of DESIGN.md #4338ca
- [[daily/2026-06-02.md]] — First real execution: 7 surfaces ported (landing, PDP, cart, shop, listing, tailoring measurements, seller dashboard); CSS comment premature-close + arbitrary-value slash pitfalls discovered; P0 palette sweep; seller shell IBM Plex Sans Arabic; Stitch IA applied to Blade dashboard; PRs merged to main
