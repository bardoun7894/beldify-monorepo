---
name: Monorepo Architecture
description: Single repository containing multiple projects with shared tooling
type: concept
sources: [sources/beldify-claude]
created: 2026-05-08
updated: 2026-05-08
---

# Monorepo Architecture

## Overview
A monorepo is a single repository containing multiple distinct projects. Beldify uses this pattern with a frontend and backend application in the same repository.

## Key Points
- Frontend lives in `beldify-frontend/` (Next.js 15)
- Backend lives in `beldify-backend/` (Laravel 10)
- Shared documentation in `docs/`
- Shared specs in `specs/`
- Benefits: easier code sharing, unified tooling, atomic commits

## Details
The monorepo approach allows developers to work across both frontend and backend without switching repositories. Shared configurations can be maintained at the root level, while each subproject maintains its own dependencies and build tools.

## See also
- [[entities/beldify]]
- [[entities/nextjs]]
- [[entities/laravel]]
- [[concepts/dev-workflow]]