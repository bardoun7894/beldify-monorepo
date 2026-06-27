# Beldify Summary

## Current State (2026-06-27)
- Production: www.beldify.com running on MyContabo (surian-deploy)
- Local: Docker (beldify-local-app at localhost:7895)
- Backend tests: 32 multi-seller pass, 24 pre-existing failures
- Frontend tests: 3495/3500 pass (5 flaky)
- Lint: 0 errors frontend, 0 parse errors PHP

## Active Work
- 014-multi-seller-orders: 29/31 done (docs + review remain)
- 016-deployment-drift-fix: 22/27 done
- OKF created 2026-06-27

## Key Commands
```bash
# Run multi-seller tests
docker exec beldify-local-app php artisan test --filter MultiSeller

# Copy files to container
docker cp <file> beldify-local-app:/var/www/html/<path>
docker exec beldify-local-app php artisan cache:clear

# Frontend
cd beldify-frontend && npm run lint && npm run test
```
