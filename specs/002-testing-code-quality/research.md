# Research: Testing Infrastructure & Code Quality Sprint

**Date**: 2026-01-26
**Status**: Complete

## Executive Summary

This document captures technology decisions for establishing frontend testing infrastructure
and improving code quality across the Beldify application. All decisions are made; no
NEEDS CLARIFICATION items remain.

## Frontend Testing Framework Decision

### Decision: Vitest + React Testing Library

**Rationale**:
- Vitest is Vite-native and extremely fast (10-20x faster than Jest for large projects)
- First-class TypeScript support without additional configuration
- Compatible with Jest API for easy migration of existing patterns
- Built-in coverage reporting via c8/istanbul
- React Testing Library encourages testing from user perspective, not implementation

**Alternatives Considered**:

| Framework | Pros | Cons | Decision |
|-----------|------|------|----------|
| Jest | Industry standard, well-documented | Slow with Next.js, complex config | Rejected |
| Vitest | Fast, modern, Vite-native | Newer, less ecosystem | **Selected** |
| Playwright Component Testing | Real browser, visual testing | Overkill for unit tests | Reserved for E2E |

**Implementation**:

```bash
# Install dependencies
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Configuration** (`vitest.config.ts`):

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '*.config.*',
        'src/mocks/**',
        '**/*.d.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

## Test File Organization

### Decision: Colocation Pattern

**Rationale**:
- Tests live next to source files they test (`__tests__` folders or `.test.tsx` suffix)
- Easy to find tests for a given component
- Encourages testing as part of development workflow
- Works well with Vitest's default file discovery

**Structure**:
```
src/
├── contexts/
│   ├── AuthContext.tsx
│   ├── AuthContext.test.tsx      # Unit tests
│   └── __tests__/
│       └── AuthContext.integration.test.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Navbar.test.tsx
│   └── common/
│       ├── Button.tsx
│       └── Button.test.tsx
└── test-utils/
    ├── index.tsx                  # Custom render with providers
    ├── mocks/                     # Shared mocks
    └── fixtures/                  # Test data
```

## Mocking Strategy

### Decision: Mock at Boundaries

**Rationale**:
- Mock external dependencies (API calls, browser APIs)
- Mock context providers at the edge
- Don't mock internal implementation details
- Use MSW (Mock Service Worker) for API mocking

**Boundary Types**:

| Boundary | Mock Approach |
|----------|---------------|
| API Calls | MSW handlers for HTTP interception |
| Context Providers | Custom render wrapper with mocked values |
| Browser APIs | jsdom built-ins + manual mocks where needed |
| External Libraries | Vitest mocking (`vi.mock()`) |

**Example Test Utilities** (`src/test-utils/index.tsx`):

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </AuthProvider>
)

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

## Component Refactoring Strategy

### Decision: Extract → Test → Verify Pattern

**Rationale**:
- Characterization tests capture current behavior before changes
- Small, incremental extractions reduce risk
- Each extraction is a separate commit for easy rollback
- Tests verify no regression after each step

**Refactoring Steps**:

1. **Write Characterization Tests**
   - Test current behavior, even if it seems wrong
   - Focus on public API (props, rendered output, events)
   - Document any quirks discovered

2. **Extract Sub-Component**
   - Move related code to new file
   - Keep original component as wrapper initially
   - Ensure no behavior changes

3. **Verify Tests Pass**
   - Run full test suite
   - Check coverage didn't decrease
   - Manual smoke test in browser

4. **Clean Up**
   - Remove unused code
   - Update imports
   - Document new structure

### AuthContext Refactoring Plan

**Current Structure** (836 lines, mixed concerns):
- Token management (storage, refresh, validation)
- Authentication methods (email, Google OAuth)
- User state management
- API calls for auth endpoints
- Caching logic

**Target Structure**:
```
src/contexts/auth/
├── AuthContext.tsx           # Main context, <200 lines
├── useTokenManager.ts        # Token storage/refresh hook
├── useGoogleAuth.ts          # Google OAuth logic
├── authApi.ts                # API calls for auth
├── authTypes.ts              # TypeScript types
└── __tests__/
    ├── AuthContext.test.tsx
    ├── useTokenManager.test.ts
    └── useGoogleAuth.test.ts
```

### Navbar Refactoring Plan

**Current Structure** (760 lines, UI components mixed):
- Navigation links
- Search functionality
- User menu (login/logout, profile)
- Cart indicator
- Wishlist indicator
- Language switcher
- Mobile menu

**Target Structure**:
```
src/components/layout/navbar/
├── Navbar.tsx                # Container, <200 lines
├── NavSearch.tsx             # Search bar
├── NavUserMenu.tsx           # User dropdown
├── NavCart.tsx               # Cart icon + count
├── NavWishlist.tsx           # Wishlist icon + count
├── NavLanguage.tsx           # Language switcher
├── NavMobile.tsx             # Mobile menu drawer
└── __tests__/
    ├── Navbar.test.tsx
    └── NavSearch.test.tsx
```

## Backend Testing Strategy

### Decision: Expand PHPUnit Coverage

**Rationale**:
- PHPUnit already configured and working
- Laravel testing utilities are excellent
- No need to introduce new framework

**Test Types**:

| Type | Purpose | Location | Example |
|------|---------|----------|---------|
| Unit | Single class/method | `tests/Unit/` | Service calculation tests |
| Feature | Full HTTP request | `tests/Feature/` | API endpoint tests |
| Integration | Component interaction | `tests/Integration/` | Service + Repository |

**Priority Services**:

1. **CommissionService** - Financial calculations, high risk
2. **CommissionAccountingService** - Accounting entries, audit trail
3. **MessageService** - User communication, data integrity
4. **CacheService** - Infrastructure, fallback behavior

**Example Test Structure**:

```php
// tests/Unit/Services/CommissionServiceTest.php
class CommissionServiceTest extends TestCase
{
    /** @test */
    public function it_calculates_commission_for_standard_order()
    {
        $service = new CommissionService();
        $result = $service->calculate(100.00, 'standard');

        $this->assertEquals(10.00, $result);
    }

    /** @test */
    public function it_handles_zero_amount_gracefully()
    {
        $service = new CommissionService();
        $result = $service->calculate(0.00, 'standard');

        $this->assertEquals(0.00, $result);
    }
}
```

## CI/CD Integration

### Decision: Add Test Stage to GitHub Actions

**Current Pipeline**:
1. lint-and-type-check
2. build
3. security (npm audit)
4. lighthouse

**Updated Pipeline**:
1. lint-and-type-check
2. **test** (NEW - frontend)
3. **test-backend** (NEW - backend)
4. build
5. security
6. lighthouse

**Configuration Update** (`.github/workflows/ci.yml`):

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm test -- --coverage
    - uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
        fail_ci_if_error: true

test-backend:
  runs-on: ubuntu-latest
  services:
    mysql:
      image: mysql:8.0
      env:
        MYSQL_ROOT_PASSWORD: root
        MYSQL_DATABASE: testing
      ports:
        - 3306:3306
  steps:
    - uses: actions/checkout@v4
    - uses: shivammathur/setup-php@v2
      with:
        php-version: '8.1'
    - run: composer install
    - run: php artisan test --coverage
```

## Open Questions (None)

All technical decisions have been made. No blocking questions remain.

## Dependencies Summary

### Frontend (New)
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^24.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0"
  }
}
```

### Backend (Existing - no changes)
- PHPUnit 10.1
- Mockery 1.4.4
