# Spec 016: Fix Deployment Drift — Git/Local Data vs Server

## Problem

The production server (`MyContabo`) is running `hermes/auto-improve/2026-06-23` instead of `main`. Multiple committed fixes are not deployed:
- Shop storefront fix (`34b7252`) — API envelope unwrap in `getShopByName`
- AI feature-toggle gate (`881b9b60`) — 9 AI features OFF by default
- Shop/name 404 fix (`9074de20`) — null-safe `?->` on store profiles
- Route fix — `products` → `getProducts` + numeric constraint

Additionally, significant uncommitted local changes exist on both frontend and backend.

## Root Cause

The auto-improve CI writes to its own detached branch (`hermes/auto-improve/*`) instead of rebasing onto `main`. The deploy target checks out the auto-improve branch, not `main`. No post-deploy step merges auto-improve back to `main`.

## Scope

- **Backend only** — switch server to `main`, commit pending changes
- **Deploy pipeline** — fix branch pinning so auto-improve rebases onto `main`

## Non-goals

- Refactoring any code
- Adding features
- Changing auto-improve bot itself

## Files affected

| File | Action |
|------|--------|
| `beldify-backend/` — uncommitted changes | Commit to `main` |
| `beldify-frontend/` — uncommitted changes | Commit to `main` |
| Server backend (`/var/local/beldify-backend-auto`) | Switch to `main` |
| Server frontend (`/var/local/beldify-auto`) | Switch to `main` |
