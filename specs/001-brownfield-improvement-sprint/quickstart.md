# Quickstart: Brownfield App Improvement Sprint

**Purpose**: Verification commands and setup instructions for the improvement sprint.

## Prerequisites

- Docker and Docker Compose installed
- PHP 8.1+ and Composer (for local testing)
- Node.js 18+ and npm/pnpm
- Sentry account with project DSN

## Environment Setup

### 1. Clone and Configure

```bash
# Ensure you're on the feature branch
git checkout 001-brownfield-improvement-sprint

# Backend environment
cd beldify-backend
cp .env.example .env
# Add these to .env:
# SENTRY_LARAVEL_DSN=https://your-dsn@sentry.io/project-id
# LOG_CHANNEL=stack

# Frontend environment
cd ../beldify-frontend
cp .env.example .env.local
# Add these to .env.local:
# NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### 2. Install Dependencies

```bash
# Backend
cd beldify-backend
composer install

# Frontend
cd ../beldify-frontend
npm install
```

### 3. Start Services

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or manually:
# Backend
cd beldify-backend
php artisan serve

# Frontend (separate terminal)
cd beldify-frontend
npm run dev
```

## Verification Commands

### P1: Stability Verification

```bash
# Backend error handling tests
cd beldify-backend
php artisan test --filter=ExceptionHandler
php artisan test --filter=ErrorResponse

# Frontend error boundary tests
cd ../beldify-frontend
npx playwright test tests/e2e/error-handling.spec.ts

# Manual verification: Trigger error and check response
curl -X POST http://localhost:8000/api/v1/test-error \
  -H "Content-Type: application/json" \
  | jq .

# Expected response structure:
# {
#   "error": {
#     "code": "TEST_ERROR",
#     "message": "This is a test error",
#     "correlation_id": "uuid-here"
#   }
# }
```

### P2: Performance Verification

```bash
# Backend performance baseline
cd beldify-backend
php artisan test --filter=Performance

# Check for N+1 queries (requires Debugbar)
# Visit http://localhost:8000 with APP_DEBUG=true
# Check Debugbar for query count per request

# Frontend performance
cd ../beldify-frontend
npx playwright test tests/e2e/performance.spec.ts

# Lighthouse audit (requires Chrome)
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json
```

### P3: Observability Verification

```bash
# Verify Sentry integration (backend)
cd beldify-backend
php artisan sentry:test

# Verify Sentry integration (frontend)
# Open browser console on http://localhost:3000
# Run: Sentry.captureMessage('Test from frontend')

# Check structured logs
docker logs beldify-backend 2>&1 | jq .

# Verify correlation IDs
curl -v http://localhost:8000/api/v1/health 2>&1 | grep -i sentry-trace
```

### P4: Security Verification

```bash
# Secret scanning
cd beldify-backend
gitleaks detect --source . --verbose

cd ../beldify-frontend
gitleaks detect --source . --verbose

# Check .gitignore coverage
cat .gitignore | grep -E "\.env|secret|credential|key"

# Verify authz on critical endpoints (should return 401)
curl -X GET http://localhost:8000/api/v1/admin/users \
  -H "Content-Type: application/json"

curl -X GET http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json"
```

## Running Full Test Suite

```bash
# Backend full suite
cd beldify-backend
php artisan test

# Frontend full suite
cd ../beldify-frontend
npx playwright test

# Both (if using npm scripts)
npm run test:all
```

## Baseline Measurements

Run these commands before making changes to establish baselines:

```bash
# Test coverage baseline
cd beldify-backend
php artisan test --coverage > ../specs/001-brownfield-improvement-sprint/baseline-coverage.txt

# Query count baseline (requires manual inspection with Debugbar)
# Document in spreadsheet:
# - Login flow: X queries
# - Checkout flow: X queries
# - Product feed: X queries per page

# Frontend metrics baseline
cd ../beldify-frontend
npx playwright test tests/e2e/performance.spec.ts --reporter=json > ../specs/001-brownfield-improvement-sprint/baseline-performance.json
```

## Troubleshooting

### Sentry not receiving errors

1. Verify DSN is correct in .env
2. Check network connectivity to sentry.io
3. Verify `APP_DEBUG=false` (debug mode may suppress Sentry)
4. Check Laravel logs for Sentry client errors

### Tests failing after changes

1. Clear caches: `php artisan cache:clear && php artisan config:clear`
2. Regenerate autoload: `composer dump-autoload`
3. Reset test database: `php artisan migrate:fresh --env=testing`

### Performance tests inconsistent

1. Ensure no other processes competing for resources
2. Run multiple times and average results
3. Use dedicated test environment (not local dev)

## Success Criteria Checklist

- [ ] Crash-free sessions >= 99% (verify in Sentry)
- [ ] Error rate reduced by 25% (compare Sentry error counts)
- [ ] P95 read latency <200ms (verify in Sentry performance)
- [ ] P95 write latency <500ms (verify in Sentry performance)
- [ ] Zero secrets in repo (gitleaks reports clean)
- [ ] All critical endpoints have authz (manual audit complete)
- [ ] All errors have correlation IDs (spot check in logs)
