---
name: Category Image Pipeline
description: How category images are seeded, stored, and served in Beldify — from Unsplash download to storefront render
type: concept
sources: [daily/2026-05-14.md]
created: 2026-05-15
updated: 2026-05-15
---

# Category Image Pipeline

## Overview
Beldify category images are sourced from Unsplash (curated Moroccan / traditional fashion themes), stored in Laravel's local storage, and served via the API as absolute `https://pro.beldify.com/storage/categories/category_{id}.jpg` URLs. The `CategoryController` uses a `resolveCategoryImage()` helper to normalize the image column value into a fully-qualified HTTPS URL.

## Key Points
- 18 category images total: 3 parent (Men/Women/Children) + 15 sub-category
- Source: Unsplash photo IDs, downloaded as 1600×1200 JPEG via HTTP (with real browser `User-Agent` header — Cloudflare blocked Python's urllib default agent)
- Storage path on server: `/var/local/beldify-monorepo/beldify-backend/storage/app/public/categories/category_{id}.jpg`
- Container path: `/var/www/html/storage/app/public/categories/category_{id}.jpg` (bind-mounted from host)
- Publicly accessible via Laravel's `storage:link` symlink → `public/storage/categories/`
- API URLs use `pro.beldify.com` domain (not `api.beldify.com`) to avoid Next.js image whitelist issues

## Details
The original category `image` DB column held either `null`, a relative filename (`category_3.jpg`), a `/storage/...` path, or a full Contabo object storage URL. The `resolveCategoryImage()` helper in `CategoryController` handles all four formats:
- `null` → returns `null` (caller decides fallback)
- Starts with `http://` or `https://` → pass-through (external URL)
- Starts with `/storage/` → prepend `https://pro.beldify.com`
- Bare filename → prepend `https://pro.beldify.com/storage/categories/`

The `APP_URL` env var was set to `http://...` (HTTP, not HTTPS), which caused `url()` / `asset()` helpers to produce HTTP URLs. Rather than changing `APP_URL` globally, the `resolveCategoryImage()` helper hardcodes the `https://pro.beldify.com` prefix for storage paths.

### Replacing a category image
1. Drop the new JPG to `/var/local/beldify-monorepo/beldify-backend/storage/app/public/categories/category_{id}.jpg` on the MyContabo host
2. `docker cp` if needed: `docker cp category_N.jpg beldify-backend:/var/www/html/storage/app/public/categories/`
3. No DB change required — the `image` column holds the ID-based filename; `resolveCategoryImage()` resolves the rest

## Related Concepts
- [[concepts/nextjs-image-config]] — Next.js whitelist that must include `pro.beldify.com` for images to render
- [[concepts/atlas-design-system]] — Design context that introduced the category image grid ("The souk")
- [[concepts/service-repository-pattern]] — `CategoryController` uses `StorageService` for URL resolution
- [[entities/mysql]] — Stores category metadata including `image` column
- [[entities/laravel]] — `CategoryController`, `StorageService`, `storage:link` all Laravel primitives

## Sources
- [[daily/2026-05-14.md]] — 18 images downloaded, deployed, DB updated, URL normalization helper written, `topCategories` endpoint patched to match same pattern
