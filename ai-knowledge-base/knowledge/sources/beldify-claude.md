---
name: Beldify Project CLAUDE.md
description: Monorepo with Next.js frontend and Laravel backend - project rules and workflow
type: source
tags: [laravel, php, artisan, nextjs, seller, architecture, refactor, multi-seller]
sources: [raw/CLAUDE.md]
created: "2026-05-08"
updated: "2026-05-08"
---
# Beldify Project CLAUDE.md

## Summary
Project rules for Claude Code on the Beldify e-commerce monorepo. Defines a mandatory workflow (Explore → Plan → Implement → Verify → Document → Commit) and documentation standards for a multi-seller e-commerce platform with Next.js 15 frontend and Laravel 10 backend.

## Key points
- Monorepo structure: `beldify-frontend/` (Next.js 15) and `beldify-backend/` (Laravel 10)
- Default to action: implement changes, not just suggestions
- Always explore code first before planning
- Commit format: `type(scope): summary` with types: feat, fix, refactor, docs, test, chore
- Docs organized in docs/api/, docs/guides/, docs/architecture/, docs/changelog/
- Frontend verification: `npm run lint`; Backend: `php artisan test`

## Quotes
> Follow: **Explore → Plan → Implement → Verify → Document → Commit**

## See also
- [[entities/beldify]]
- [[entities/nextjs]]
- [[entities/laravel]]
- [[concepts/monorepo]]
- [[concepts/dev-workflow]]