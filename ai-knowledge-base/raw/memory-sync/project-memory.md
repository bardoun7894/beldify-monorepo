---
title: Pi Memory — Project (beldify)
type: source
sync_origin: pi-memory://project/-Users-mohamedbardouni-projects-beldify
source: ~/.pi/memory/projects/-Users-mohamedbardouni-projects-beldify.md
---

# Pi Memory — Project: beldify

Auto-mirrored from Pi's persistent memory. Curated, char-capped notes
surviving across sessions for this project only.

- Production deploy: ssh MyContabo, backend bind mount at /var/local/beldify-monorepo/beldify-backend → beldify-backend container:/var/www/html. Backend containers: beldify-backend, beldify-nginx-backend. Frontend: beldify-monorepo-frontend-1. Docker compose at /var/local/beldify-auto-deep/. DB: beldify-mysql, Redis: beldify-redis, Soketi: beldify-soketi. Fix: beldify-backend uses bind mount (not named volume) so git pull on host reflects immediately.
- 6 Pi workflows in .pi/workflows/: fullstack-dev (6-phase FE+BE+review), fix-bug (diagnose→fix→verify loop), api-route (Laravel endpoint pipeline), frontend-page (Next.js page pipeline), db-change (migration pipeline), deploy-check (pre-deploy readiness). Run via workflow_run { workflow: "<id>", input: "..." }.
- Beldify multi-seller orders (014) DONE: OrderService::createCheckoutOrder() groups by store_id → 1 OrderGroup + N Orders, per-seller shipping/COD/notifications. OrderGroup.markPaid(). Frontend cart/checkout/confirmation/history consume per-seller shapes. 32/32 tests pass. T029 docs + T031 review remain. AuthController::register() creates Customer directly. All admin controllers pass real data. Cart table bug FIXED: null-safe guest name + route names.
- Before any project exploration: read okf/index.md and okf/summary.md first. OKF replaces bash/git commands for state discovery. The KB is the source of truth, OKF is the agent-ready surface layer.
- Docker named volumes (not bind mounts) on beldify-local — file edits must be docker cp'd: `docker cp <host_path> beldify-local-app:/var/www/html/<container_path>`. Then `docker exec beldify-local-app php artisan cache:clear`. Container is from docker-compose.yml (not .dev.yml).
- All admin Blade controllers pass real data. Cart model supports guest_token. Cart table had 2 bugs: null $cart->user for guests + wrong route name (carts.show→admin.carts.show). Abandoned carts had dead route (carts.send-recovery). OrderManagementController is dead code — routes overwritten by Admin\OrderController prefix. BannerController is at root namespace, not Admin. Frontend AuthController::register() creates Customer directly.
