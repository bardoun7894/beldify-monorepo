---
source: panel
reviewers: [claude]
date: 2026-06-27
target: scripts/drift-check.py
scope: plan
---

# Panel verdict — Drift-Check Script

## Design rationale

Build an SSH-to-SSH git SHA comparison tool that detects drift between local
development and production server, with an optional `--fix` auto-sync mode.

## Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | Python 3 (stdlib) | No pip dependencies; SSH runs via subprocess |
| Output format | Printed table with status columns | Human-readable at a glance; parseable by pattern |
| Conflict resolution | `--theirs` for sw.js only | sw.js is a generated PWA file; other conflicts abort |
| Submodule sync | `git submodule update --remote --merge` | Standard upstream merge; respects submodule contract |
| Container restart | `docker restart beldify-backend` | Resets PHP opcache after code sync |
| `--quick` flag | SHA-only comparison | One SSH round-trip per repo = ~2s total |
| `--fix` flag | Pull + conflict-resolve + submodule + restart | Idempotent; safe to re-run |

## Architecture

```
                    ┌─────────────────────────┐
                    │   drift-check.py          │
                    │   --quick | --fix         │
                    └──────────┬──────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
     Local SHA (git)    Server SHA (ssh)    SSH commands
     beldify-monorepo   beldify-monorepo    git pull
     beldify-backend    beldify-backend     submodule update
                                           docker restart
```

## Consensus

All reviewers agree on:

1. Python 3 stdlib (no pip dependencies)
2. Two flags: `--quick` and `--fix`
3. Both repos compared: monorepo + submodule
4. Conflict resolution only for sw.js (auto `--theirs`)
5. Docker restart for backend container
6. Output as a table with status indicators
7. Integration with OKF via KB ingest after first run
