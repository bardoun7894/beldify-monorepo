---
name: prod-local-git-drift
description: CSS cache-buster bumps applied directly on prod without committing create a divergence that breaks rsync and hides regressions
type: concept
tags: [php, blade, css, html, state, query, docker, deploy, pattern, cache]
sources: []
created: ""
updated: ""
---
# Prod-Local Git Drift

## Problem

During live debugging on Beldify's Contabo production server, CSS files and blade layouts are edited directly (via `nano`/`vim` on the container) to iterate fast. Cache-buster query strings (`?v=14`, `?v=2`) are bumped inline to force browser refresh. These prod changes are **never committed back to local git**.

The result: local HEAD becomes progressively behind prod. On the next rsync, local files overwrite prod files, silently **regressing** all in-flight prod fixes.

## Concrete Example (2026-05-28)

`resources/views/admin/includes/head.blade.php` on prod contained:
```html
<link rel="stylesheet" href="{{ asset('css/sidebar-v3.css') }}?v=14">
<link rel="stylesheet" href="{{ asset('css/header-v3.css') }}?v=2">
<link rel="stylesheet" href="{{ asset('css/v3-pages.css') }}?v=2">
```

Local HEAD had none of these lines. After `rsync`, prod reverted to the pre-v3 head.

## Fix: Catch-Up Commits

Before every rsync deploy, capture prod state via a "catch-up" commit:

1. SSH into prod container: `docker exec -it beldify-app bash`
2. Print the drifted file: `cat resources/views/admin/includes/head.blade.php`
3. Apply prod content to local file, commit: `git commit -m "chore: catch up head.blade.php with prod state"`
4. Then rsync: `bash sync-and-run.sh`

## Prevention

- **Never** bump cache-buster versions directly on prod without committing first
- Use the `?v={{ config('app.version') }}` pattern and bump the env var instead — single source of truth
- Keep a "prod drift" checklist before every rsync: `git diff HEAD origin/main -- public/css/ resources/views/admin/includes/`

## Relationship to Other Issues

Prod-local git drift compounded several other bugs in this session:
- `dashboard.blade.php` still included legacy sidebar after v3 wiring was added to prod — local rsync reverted it
- CSS selector fixes for `:has()` and `[dir="rtl"]` were overwritten twice during the session

## Sources
- [[sources/daily/2026-05-28]] — session 6d18f0a6, "u the issue u change the sidebar from production" exchange
- [[concepts/docker-deployment]] — Contabo rsync + container patterns
