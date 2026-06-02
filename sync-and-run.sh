#!/bin/bash
# Sync beldify to Contabo and rebuild Docker

set -e

echo "📦 Syncing beldify to Contabo..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  ~/projects/beldify/ \
  MyContabo:/var/local/beldify-monorepo/

echo "🔨 Rebuilding & restarting frontend Docker..."
ssh MyContabo "cd /var/local/beldify-monorepo && docker compose -f docker-compose.dev.yml up -d --build frontend"

echo "✅ Done! Frontend: http://your-domain:4987"
echo "   Check with: docker ps | grep beldify"