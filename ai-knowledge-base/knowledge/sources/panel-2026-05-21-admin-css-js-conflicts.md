---
name: Panel decision — admin CSS/JS conflicts (Atlas vs Filament)
description: "Strategic panel; decided finish Atlas migration (not Filament), commissions-cluster-first + CI freeze rules"
type: source
tags: [php, migration, filament, tailwind, css, ci, atlas]
sources: [raw/panel/2026-05-21-admin-css-js-conflicts.md]
created: "2026-06-03"
updated: "2026-06-03"
---
# Panel decision — admin CSS/JS conflicts (Atlas vs Filament)

## Summary
A strategic 3-reviewer panel on the chronic admin CSS/JS conflicts (280 views, 189 Bootstrap, 60 PixInvent). Decision: continue the Atlas migration rather than introduce Filament, because Filament ships its own Tailwind config (re-creating the conflict) and is a Livewire rewrite of all 280 views.

## Key points
- **Decision**: finish Atlas (S3→S1), do NOT stand up parallel Filament. Gemini dissented (S2/Filament, conf 4) — preserved for revisit if the Atlas roadmap stalls or a greenfield admin module ships.
- **First packet (unanimous)**: commissions cluster correctness + Atlas migration in one PR (~8 files, 1 day) — fixes invisible-button prod bugs AND advances migration. Replace 64 phantom `tw-primary-*` with real tokens; dynamic `tw-bg-{{ $status }}-100` → static `@php match()`.
- **CI freeze rules**: ban inline `<style>` >10 lines, dynamic Tailwind class concatenation, `tw-primary-*` literals, mixed `data-toggle`/`data-bs-toggle`.
- **Chrome layer (~80% of visual impact) already done**; remaining migration = content panels where the correctness bugs live.
- **Do NOT** remove BS4 site-wide before Frest chrome retires (crashes `app-menu.js`).

## See also
- [[concepts/admin-panel-migration-decision]]
- [[concepts/admin-atlas-migration]]
- [[concepts/tailwind-jit-dynamic-class-pitfalls]]
