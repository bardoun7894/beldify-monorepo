# CLAUDE.md — Project Rules for Claude Code

## Core Principle
**Default to action**: Implement the requested change, not just suggestions. If intent is unclear, ask 1-3 targeted questions then proceed with the safest useful assumption.

## Workflow (Mandatory)
Follow: **Explore → Plan → Implement → Verify → Document → Commit**

1. **Explore**: Read relevant files first; never speculate about code you haven't inspected
2. **Plan**: Present a short plan (3-7 bullets) and confirm if the change is risky or broad
3. **Implement**: Do only what was asked—no extra refactors/abstractions unless requested
4. **Verify**: Run project checks (tests/lint/build) and report results
5. **Document**: Update or create docs for any behavior/API changes
6. **Commit**: Small, logical commits with one intent each

## Documentation Rules (Always Apply)

### When to Create/Update Docs
- **API changes**: Update endpoint docs immediately
- **New features**: Create usage docs before PR
- **Config changes**: Document in relevant README or config guide
- **Breaking changes**: Add migration guide
- **Complex logic**: Add inline comments explaining "why", not "what"

### Documentation Standards
```
docs/
├── api/           # API endpoint documentation
├── guides/        # How-to guides and tutorials
├── architecture/  # System design and decisions
└── changelog/     # Version history and migration notes
```

### Doc Quality Checklist
- [ ] Examples included (copy-paste ready)
- [ ] Prerequisites listed
- [ ] Edge cases documented
- [ ] Related docs linked
- [ ] Updated table of contents (if applicable)

### Auto-Documentation Triggers
Create/update docs automatically when:
- Adding new API endpoints → `docs/api/{endpoint}.md`
- Changing environment variables → Update `.env.example` + `docs/setup.md`
- Adding new commands → Update relevant README
- Modifying database schema → Update `docs/architecture/database.md`
- Adding new services/modules → Update `docs/architecture/`

## Verification (Definition of Done)
- Run the project's checks when applicable and report what was run + result
- If you can't run commands, explain exactly what the user should run and expected output
- For docs: Verify links work, examples are accurate, formatting renders correctly

## Git Rules
- Work in a feature branch; keep commits small and logical
- Commit format: `type(scope): summary`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- **Include docs updates in the same PR when behavior/API changes**

## Output Style
- Prefer concrete diffs/edits over long explanations
- Be explicit about files/paths changed
- When proposing changes affecting security or data, call out risks and safe defaults
- For docs: Show before/after snippets when updating existing content

## Project Structure
This is a monorepo with:
- `beldify-frontend/` — Next.js 15 frontend (see `beldify-frontend/CLAUDE.md`)
- `beldify-backend/` — Laravel 10 backend (see `beldify-backend/CLAUDE.md`)

Refer to subproject CLAUDE.md files for specific commands and patterns.

## Quick Reference

### Common Verification Commands
```bash
# Frontend
cd beldify-frontend && npm run lint

# Backend
cd beldify-backend && php artisan test
```

### Doc Templates
When creating new docs, use this structure:
```markdown
# [Title]

## Overview
Brief description of what this covers.

## Prerequisites
- List requirements

## Usage
Code examples here.

## Configuration
Options and settings.

## Troubleshooting
Common issues and solutions.

## Related
- Links to related docs
```
