# Panel: Beldify Frontend Production Fix — 2026-06-27

## Problem

Beldify frontend running `next dev` in production on MyContabo. Missing Tailwind CSS classes (tw-bg-white/80, tw-translate-x-1/2, etc.) because compiled tailwind.css doesn't include them.

## Diagnostic Plan

1. SSH into MyContabo
2. Check docker-compose.yml for `next dev` vs `next build && next start`
3. Check compiled tailwind.css content
4. Check for @serwist/next and SWC glibc issues

## Fix Plan

1. Change docker-compose.yml: `next dev` → `next build && next start`
2. Rebuild Tailwind: `npx tailwindcss -i resources/css/tailwind.css -o public/css/tailwind.css --minify`
3. Clear view cache: `php artisan view:clear`
4. Rebuild/restart containers

## Verdict

CONSENSUS: Production requires production build, not dev server. Tailwind purge needs all classes scanned.
