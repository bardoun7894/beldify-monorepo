---
name: docs/guides/google-oauth-setup.md
description: Auto-synced from docs/guides/google-oauth-setup.md
type: source
sync_origin: docs/guides/google-oauth-setup.md
sync_hash: b91948430401738c
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from docs/guides/google-oauth-setup.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Google Sign-In — 5-minute setup (the only manual step left)

All code is wired and tested. The Google button auto-hides until the client ID exists, so nothing breaks meanwhile.

## 1. Create the OAuth client (you — needs your Google account)

1. https://console.cloud.google.com/apis/credentials → select/create project "Beldify".
2. **Configure consent screen** (if first time): External → app name "Beldify", support email, save through the steps (no scopes needed beyond default).
3. **Create credentials → OAuth client ID → Web application**:
   - Name: `Beldify Web`
   - Authorized JavaScript origins:
     - `https://beldify.com`
     - `https://www.beldify.com`
     - `http://localhost:3000` (dev)
   - Authorized redirect URIs: none needed (One-Tap/ID-token flow, not redirect flow).
4. Copy the **Client ID** (looks like `1234567890-abc123.apps.googleusercontent.com`). The client *secret* is only needed backend-side if we later add the redirect flow — copy it too and keep it private.

## 2. Frontend (build-time var — requires rebuild)

```bash
# beldify-frontend/.env.local (dev) AND the prod frontend .env used by docker-compose.prod.yml
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
```
Prod: rebuild via `docker-compose -f docker-compose.prod.yml build && up -d` (NEXT_PUBLIC_* vars are baked at build time).

## 3. Backend (runtime var)

```bash
# beldify-backend/.env on prod (and local)
GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<the secret>
```
Backend reads `config('services.google.client_id')` (config/services.php:44) and uses it to **verify** the One-Tap ID token server-side (GoogleAuthController). After editing prod .env: `docker exec beldify-backend php artisan config:clear`.

## 4. Verify

- Frontend: Google button appears on /login and /register (it auto-hides when the var is missing).
- Click → One-Tap → backend `/google-login` verifies the token signature + audience → session/token issued.
- Failure mode if IDs mismatch: backend returns "Invalid token audience" — re-check both env vars use the SAME client ID.

