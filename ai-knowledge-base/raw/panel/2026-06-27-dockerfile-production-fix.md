# Panel Artifact — Beldify Frontend Dockerfile Production Fix

**Date:** 2026-06-27
**Context:** Health endpoint 503 — frontend container cannot reach backend API
**Decision:** Unanimous — apply 3 Dockerfile changes

## Problem

- `health/route.ts` tries `NEXT_PUBLIC_API_URL` → falls back to hardcoded IP `http://18.100.117.252` (unreachable in container)
- Dockerfile has `NODE_ENV=development` → not appropriate for production
- Dockerfile has `CMD ["npm", "run", "dev"]` → runs dev server, not `next start`

## Changes

1. `ENV NODE_ENV=development` → `ENV NODE_ENV=production`
2. Add `ENV NEXT_PUBLIC_API_URL=https://api.beldify.com` after PORT line
3. `CMD ["npm", "run", "dev"]` → `CMD ["npm", "run", "start:dev"]`

## Reasoning

- `NEXT_PUBLIC_API_URL=https://api.beldify.com` lets health endpoint reach backend via public Traefik-routed URL
- `NODE_ENV=production` enables Next.js optimizations
- `start:dev` script runs `next start` (production server) rather than `next dev`
- Server-side env var is available at runtime for API routes like health check

## Deployment

- Commit + push → SSH MyContabo → git pull → `docker-compose build frontend && docker-compose up -d frontend`
- Verify: `curl -s https://www.beldify.com/api/health`
