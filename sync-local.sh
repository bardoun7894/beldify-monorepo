#!/bin/bash
# Sync host beldify-backend code into the running local container (beldify-local-app),
# rebuilding Tailwind first so new tw- utility classes are actually emitted.
set -e
cd "$(dirname "$0")/beldify-backend"
C=beldify-local-app
echo "🎨 Rebuilding Tailwind…"
node_modules/.bin/tailwindcss -i resources/css/tailwind.css -o public/css/tailwind.css --minify 2>/dev/null
echo "📦 Copying views + assets + lang into $C…"
docker cp resources/views "$C:/var/www/html/resources/"
docker cp resources/lang  "$C:/var/www/html/resources/"
docker cp public/css/tailwind.css "$C:/var/www/html/public/css/tailwind.css"
docker cp public/css/seller-shell.css "$C:/var/www/html/public/css/seller-shell.css" 2>/dev/null || true
docker cp public/js/seller-dashboard.js "$C:/var/www/html/public/js/seller-dashboard.js" 2>/dev/null || true
echo "🧹 Clearing caches…"
docker exec "$C" sh -lc 'php artisan view:clear >/dev/null 2>&1; php artisan config:clear >/dev/null 2>&1' || true
echo "✅ Synced. Hard-refresh the browser (⌘⇧R)."
