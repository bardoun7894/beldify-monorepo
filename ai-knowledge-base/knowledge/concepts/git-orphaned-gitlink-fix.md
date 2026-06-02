---
name: Git Orphaned Gitlink Fix
description: Converting a mode-160000 gitlink with no .gitmodules and no inner .git into a normal tracked subdirectory — the pattern that unblocked all Beldify worktrees
type: concept
sources: [daily/2026-05-24.md]
created: 2026-05-25
updated: 2026-05-25
---

# Git Orphaned Gitlink Fix

A **gitlink** (mode `160000`) is Git's internal marker for a submodule entry. When a directory is recorded as mode 160000 in the tree but has no corresponding entry in `.gitmodules` and no `.git` directory inside it, it becomes an *orphaned gitlink* — effectively invisible to Git.

## Symptoms

- `git status` shows the directory as clean even when files inside change
- `git ls-tree HEAD <dir>` shows `160000` mode instead of `040000`
- `git worktree add` creates the branch with an empty directory — all files are absent
- File watchers and build tools see the directory but CI/worktree builds see nothing

## Diagnosis

```bash
# Check mode — 160000 = submodule/gitlink, 040000 = normal tree
git ls-tree HEAD beldify-frontend

# Confirm no submodule registration
cat .gitmodules   # should be empty or missing

# Confirm no inner git dir
ls beldify-frontend/.git   # should fail
```

If mode is 160000 but both checks above come back empty/missing, you have an orphaned gitlink.

## Fix

```bash
# Remove the gitlink record (does not touch working-tree files)
git rm --cached beldify-frontend

# Stage all real files as a normal tracked tree
git add beldify-frontend/

git commit -m "chore: convert beldify-frontend from orphaned gitlink to tracked subdir"
```

After this commit, `git ls-tree HEAD beldify-frontend` returns `040000 tree …` and all worktrees receive the full file tree.

## Beldify Application (2026-05-24)

`beldify-frontend/` had been recorded as mode 160000 at some earlier point (likely an accidental `git submodule add` that was never completed). Every git worktree created for the Atlas frontend migration Phase 2/3 fan-out contained an empty `beldify-frontend/` — agents were editing nonexistent files. The fix was committed as `9c143d6`, unblocking all four parallel Phase 2 workers.

## Key Invariants

- `git rm --cached` only removes the index entry; it does **not** delete files on disk
- The subsequent `git add` must include the trailing `/` to stage the directory contents recursively
- If a legitimate submodule is needed later, use `git submodule add` properly — never create a gitlink manually

## Related

- [[concepts/atlas-frontend-migration]] — the fan-out that revealed this bug
- [[concepts/docker-bind-mount-over-rebuild]] — separate "files missing" pattern in Docker
