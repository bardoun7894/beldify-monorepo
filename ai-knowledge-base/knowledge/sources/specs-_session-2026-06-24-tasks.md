---
name: specs/_session/2026-06-24-tasks.md
description: Auto-synced from specs/_session/2026-06-24-tasks.md
type: source
sync_origin: specs/_session/2026-06-24-tasks.md
sync_hash: 774236bbc3981d01
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/_session/2026-06-24-tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Session task log — 2026-06-24

<!-- Auto-managed by /kb-spec log. -->

## Pending
- [ ] Fix deploy pipeline: auto-improve must rebase onto `main` before PR

## Done
- [x] P0-1 deployed: backend on `main` at `/var/local/beldify-monorepo` — ShopController rewrite + null-safe store profiles + route constraint + AI feature-toggle gate now live on server
- [x] P0-2 committed to main: pending backend local changes (CustomerController ERP scoping removed, tailor landing locales, updated tests) — commit 390fe07f
- [x] P0-3 committed to main: frontend locale `compare.*` keys — commit d53921a
- [x] Server monorepo switched from `001-api-alignment` to `main` branch (d53921a)
- [x] Server backend Docker containers restarted, migrations run, caches cleared
- [x] `/var/local/beldify-backend-auto` also switched to `main` + pulled
- [x] Analysis: see specs/016-deployment-drift-fix/ for full diagnosis

