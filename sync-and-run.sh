#!/bin/bash
# Deploy beldify to Contabo prod — ONE safe command.
#
# History: the old version rsynced then rebuilt the frontend with the *dev*
# compose. That caused two repeated prod outages (see ai-knowledge-base /
# memory "beldify-sync-and-run-footguns"):
#   1) rsync --delete from macOS (case-insensitive fs) deletes the server's
#      app/Http/Controllers/API -> Api symlink, so uppercase `API\…` controller
#      imports fail to autoload on Linux → routes/api.php fatals → API 500s.
#   2) docker-compose.dev.yml runs `npm run dev` on host port 3001, but the live
#      Traefik endpoint expects 4987 → storefront 502.
# This version repairs the symlink and builds the frontend with the PROD compose
# (real next build/start on 4987), then verifies prod is actually serving.

set -euo pipefail

REMOTE=MyContabo
REMOTE_DIR=/var/local/beldify-monorepo
BACKEND_CT=beldify-backend
PROJECT=beldify-monorepo

echo "📦 Syncing beldify to Contabo..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'beldify-backend/storage/app' \
  --exclude 'beldify-backend/storage/framework' \
  --exclude 'beldify-backend/public/storage' \
  --exclude 'beldify-frontend/.env*' \
  ~/projects/beldify/ \
  "$REMOTE:$REMOTE_DIR/"
# NOTE: .env and storage/ are EXCLUDED on purpose — prod .env diverges from local
# (ASSET_URL, FILESYSTEM_DISK, APP_URL set directly on the server), and rsync
# --delete on storage/app would wipe prod-only uploaded media. Never remove these.

echo "🔐 Restoring storage/cache ownership (rsync -avz from macOS stamps files uid 501 → www-data can't write → optimize:clear + every request 500s)..."
ssh "$REMOTE" "docker exec $BACKEND_CT sh -lc 'chown -R www-data:www-data storage bootstrap/cache && find storage bootstrap/cache -type d -exec chmod 775 {} \;'"

echo "🔗 Repairing backend API->Api case-sensitivity symlink (rsync --delete wipes it)..."
ssh "$REMOTE" "docker exec $BACKEND_CT sh -lc 'cd app/Http/Controllers && ln -sfn Api API; cd /var/www/html && composer dump-autoload -o >/dev/null 2>&1 && php artisan optimize:clear >/dev/null 2>&1'"

echo "🖼️  Recreating public/storage symlink (rsync --delete wipes it → every /storage/* image 404s, e.g. category photos)..."
ssh "$REMOTE" "docker exec $BACKEND_CT php artisan storage:link >/dev/null 2>&1 || true"

echo "🗃️  Running pending backend migrations (non-interactive)..."
ssh "$REMOTE" "docker exec $BACKEND_CT php artisan migrate --force" || {
  echo "⚠️  Migration step failed — check backend logs before trusting the deploy."; exit 1;
}

echo "♻️  Restarting backend to flush PHP-FPM opcache (optimize:clear does NOT clear opcache → new controllers/routes/views keep serving STALE until restart)..."
ssh "$REMOTE" "docker restart $BACKEND_CT >/dev/null 2>&1 && sleep 3 && docker exec $BACKEND_CT sh -lc 'php artisan storage:link >/dev/null 2>&1; php artisan config:cache >/dev/null 2>&1; php artisan route:cache >/dev/null 2>&1; php artisan view:cache >/dev/null 2>&1' || true"

echo "🔨 Building & starting PROD frontend (real next build/start, port 4987)..."
# Stop the stale dev container if it exists (wrong port 3001, dev mode).
ssh "$REMOTE" "docker rm -f beldify-frontend >/dev/null 2>&1 || true"
ssh "$REMOTE" "cd $REMOTE_DIR && docker compose -p $PROJECT -f docker-compose.prod.yml up -d --build frontend"

echo "🔎 Verifying prod is serving..."
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://beldify.com || echo 000)
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    echo "✅ Done! https://beldify.com -> HTTP $code"
    curl -s -o /dev/null -w "   /products -> HTTP %{http_code}\n" --max-time 20 https://beldify.com/products || true
    exit 0
  fi
  echo "   …still warming up (HTTP $code), retry $i/20"; sleep 15
done

echo "❌ beldify.com did not return healthy after ~5min. Investigate:"
echo "   ssh $REMOTE 'docker logs beldify-monorepo-frontend-1 --tail 40'"
exit 1
