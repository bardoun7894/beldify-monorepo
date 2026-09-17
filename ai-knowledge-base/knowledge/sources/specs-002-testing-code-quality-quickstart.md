---
name: specs/002-testing-code-quality/quickstart.md
description: Auto-synced from specs/002-testing-code-quality/quickstart.md
type: source
sync_origin: specs/002-testing-code-quality/quickstart.md
sync_hash: 077ffaf6a20b4650
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/002-testing-code-quality/quickstart.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Quickstart: Testing Infrastructure & Code Quality Sprint

**Purpose**: Commands for running tests and verifying quality improvements.

## Prerequisites

- Node.js 18+ and npm
- PHP 8.1+ and Composer
- Docker (for backend database tests)

## Frontend Testing

### Initial Setup

```bash
cd beldify-frontend

# Install test dependencies
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event msw

# Verify installation
npx vitest --version
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/contexts/AuthContext.test.tsx

# Run tests matching a pattern
npm test -- --grep "should login"

# Run tests in UI mode (interactive)
npm run test:ui
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux

# Check coverage thresholds
npm run test:coverage -- --reporter=json
```

### Writing Tests

```bash
# Create test file for a component
touch src/components/MyComponent.test.tsx

# Test file template
cat > src/components/MyComponent.test.tsx << 'EOF'
import { render, screen } from '@/test-utils'
import { describe, it, expect } from 'vitest'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
EOF
```

## Backend Testing

### Running Tests

```bash
cd beldify-backend

# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test file
php artisan test tests/Unit/Services/CommissionServiceTest.php

# Run specific test method
php artisan test --filter=it_calculates_commission

# Run only unit tests
php artisan test --testsuite=Unit

# Run only feature tests
php artisan test --testsuite=Feature

# Run in parallel (faster)
php artisan test --parallel
```

### Coverage Reports

```bash
# Generate coverage report (requires Xdebug or PCOV)
php artisan test --coverage --coverage-html=coverage

# View HTML coverage report
open coverage/index.html

# Check minimum coverage threshold
php artisan test --coverage --min=80
```

### Writing Tests

```bash
# Create unit test
php artisan make:test Services/CommissionServiceTest --unit

# Create feature test
php artisan make:test Api/OrderControllerTest

# Test file template
cat > tests/Unit/Services/CommissionServiceTest.php << 'EOF'
<?php

namespace Tests\Unit\Services;

use App\Services\CommissionService;
use PHPUnit\Framework\TestCase;

class CommissionServiceTest extends TestCase
{
    /** @test */
    public function it_calculates_commission_correctly()
    {
        $service = new CommissionService();
        $result = $service->calculate(100.00, 'standard');

        $this->assertEquals(10.00, $result);
    }
}
EOF
```

## CI/CD Pipeline

### Verify CI Configuration

```bash
# Check GitHub Actions workflow
cat .github/workflows/ci.yml

# Ensure test job exists
grep -A 20 "test:" .github/workflows/ci.yml
```

### Local CI Simulation

```bash
# Run all checks locally (same as CI)
npm run lint
npm run type-check
npm test
npm run build

# Backend checks
cd beldify-backend
./vendor/bin/phpcs
php artisan test
```

## Refactoring Verification

### Check Component Size

```bash
# Count lines in target components
wc -l beldify-frontend/src/contexts/AuthContext.tsx
wc -l beldify-frontend/src/components/layout/Navbar.tsx
wc -l beldify-frontend/src/components/MegaOffers.tsx
wc -l beldify-frontend/src/components/ProductFilters.tsx

# Find all components over 400 lines
find beldify-frontend/src -name "*.tsx" -exec wc -l {} \; | awk '$1 > 400 {print}'
```

### Verify No Regressions

```bash
# Before refactoring - capture baseline
npm test -- --coverage > baseline-coverage.txt
git stash  # Save current work

# After refactoring - compare
npm test -- --coverage > after-coverage.txt
diff baseline-coverage.txt after-coverage.txt

# Should show same or better coverage
```

## Debugging Tests

### Frontend

```bash
# Run single test with verbose output
npm test -- --reporter=verbose src/contexts/AuthContext.test.tsx

# Debug with Node inspector
node --inspect-brk ./node_modules/.bin/vitest run src/contexts/AuthContext.test.tsx

# Check test environment
npm test -- --run --reporter=json 2>&1 | jq .
```

### Backend

```bash
# Verbose test output
php artisan test --verbose

# Stop on first failure
php artisan test --stop-on-failure

# List all available tests
php artisan test --list-tests
```

## Success Criteria Checklist

### US1: Frontend Testing Infrastructure
- [ ] `npm test` runs without errors
- [ ] `npm run test:coverage` generates report
- [ ] Coverage report shows percentage for each file
- [ ] CI pipeline runs tests and blocks on failure

### US2: Critical Path Coverage
- [ ] AuthContext coverage >= 80%
- [ ] CartContext coverage >= 80%
- [ ] Form validation tests pass
- [ ] All critical path tests pass

### US3: Component Refactoring
- [ ] AuthContext.tsx < 400 lines
- [ ] Navbar.tsx < 400 lines
- [ ] All existing tests still pass
- [ ] No behavior regressions (manual verification)

### US4: Backend Coverage
- [ ] CommissionService has unit tests
- [ ] MessageService has unit tests
- [ ] Backend coverage improved by 30%
- [ ] All backend tests pass

## Troubleshooting

### "Module not found" in tests

```bash
# Check path aliases in vitest.config.ts
grep -A 5 "alias" vitest.config.ts

# Ensure paths match tsconfig.json
grep -A 10 "paths" tsconfig.json
```

### Tests timing out

```bash
# Increase timeout
npm test -- --timeout=10000

# Check for async issues
npm test -- --reporter=verbose
```

### Coverage not increasing

```bash
# Check which files are excluded
grep -A 10 "exclude" vitest.config.ts

# Verify test files are being found
npm test -- --list
```

### Backend tests failing with database errors

```bash
# Reset test database
php artisan migrate:fresh --env=testing

# Check database configuration
grep -A 5 "testing" config/database.php
```

