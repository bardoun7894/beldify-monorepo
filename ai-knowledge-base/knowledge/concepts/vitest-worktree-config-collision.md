---
name: Vitest Worktree Config Collision
description: Vitest walks parent directories for vite.config.ts — in a git worktree the parent may be the monorepo root with a config that lacks vitest as a dependency, causing test runs to crash
type: concept
sources: [daily/2026-05-24.md]
created: 2026-05-24
updated: 2026-05-24
---

# Vitest Worktree Config Collision

## The Problem

Vitest resolves its config by walking up the directory tree from the test file's location until it finds a `vite.config.ts` (or `vitest.config.ts`). In a git worktree, the worktree root sits inside the monorepo directory structure, so the walk can escape the worktree and land on the **monorepo root `vite.config.ts`** — which does not have `vitest` in its dependencies. This causes Vitest to crash or behave unexpectedly.

```
/Users/dev/projects/beldify/              ← monorepo root, has vite.config.ts (no vitest)
  .claude/worktrees/atlas-phase2/         ← git worktree
    beldify-frontend/                     ← actual project
      vitest.config.ts?  ← missing → Vitest walks up and hits monorepo root
```

## Symptoms

- `Error: Cannot find module 'vitest'` when running tests inside a worktree
- Tests pass locally (main checkout) but fail in CI or worktree agents
- Confusing stack traces pointing to the wrong config file

## Fixes

**Option A — Local vitest config (preferred):**
Add a `vitest.config.ts` at the worktree project root that explicitly sets `root`:

```ts
// beldify-frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: __dirname,
  },
});
```

**Option B — Explicit `--config` flag:**
```bash
vitest run --config ./beldify-frontend/vitest.config.ts
```

**Option C — `vite.config.ts` root anchor:**
Add `test: { root: __dirname }` inside the existing `vite.config.ts` of the frontend project so Vitest stops walking when it finds it.

## When This Bites

Any time a parallel agent fan-out uses `git worktree add` and the worktree is a subdirectory inside the monorepo, not a sibling. The Atlas frontend migration Phase 1–4 used worktrees at `.claude/worktrees/atlas-phase*/` which created this collision.

## Prevention

Add a local `vitest.config.ts` to any project that runs tests, even if it only sets `root: __dirname`. This anchors Vitest's config resolution within the project boundary.
