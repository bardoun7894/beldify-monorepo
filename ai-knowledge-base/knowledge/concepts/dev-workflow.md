---
name: Development Workflow
description: Standard process for making changes in the Beldify project
type: concept
tags: [php, artisan, cd, refactor]
sources: [sources/beldify-claude]
created: "2026-05-08"
updated: "2026-05-08"
---
# Development Workflow

## Overview
The mandatory workflow for all changes in the Beldify project follows six sequential phases: Explore → Plan → Implement → Verify → Document → Commit.

## Key Points
1. **Explore**: Read relevant files first; never speculate about code you haven't inspected
2. **Plan**: Present a short plan (3-7 bullets) and confirm if the change is risky or broad
3. **Implement**: Do only what was asked—no extra refactors/abstractions unless requested
4. **Verify**: Run project checks (tests/lint/build) and report results
5. **Document**: Update or create docs for any behavior/API changes
6. **Commit**: Small, logical commits with one intent each

## Commit Format
Uses `type(scope): summary` format:
- `feat`: New features
- `fix`: Bug fixes
- `refactor`: Code restructuring
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance

## Verification Commands
- Frontend: `cd beldify-frontend && npm run lint`
- Backend: `cd beldify-backend && php artisan test`

## See also
- [[sources/beldify-claude]]
- [[concepts/monorepo]]
- [[concepts/documentation-standards]]