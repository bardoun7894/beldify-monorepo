# Repository Guidelines

## Project Structure & Module Organization
- Monorepo layout with two apps: `beldify-frontend/` (Next.js 15) and `beldify-backend/` (Laravel 10).
- Backend code lives in `beldify-backend/app/`, routes in `beldify-backend/routes/`, configs in `beldify-backend/config/`, tests in `beldify-backend/tests/`, and web assets in `beldify-backend/public/`.
- Frontend source lives in `beldify-frontend/src/` (App Router, components, hooks, services, utils), with assets in `beldify-frontend/public/`.
- Documentation lives in `docs/` with `api/`, `guides/`, `architecture/`, and `changelog/`.

## Build, Test, and Development Commands
Frontend (`beldify-frontend/`):
- `npm run dev` starts Next.js dev server on port 3000.
- `npm run build:dev` / `npm run build:prod` builds dev or prod bundles.
- `npm run start:dev` / `npm run start:prod` runs built app on ports 3001/7894.
- `npm run lint` runs ESLint.
- `npm run test` / `npm run test:coverage` runs Vitest.

Backend (`beldify-backend/`):
- `php artisan serve` starts Laravel dev server.
- `npm run dev` runs Vite for frontend assets.
- `php artisan migrate` applies DB migrations.
- `php artisan test` runs PHPUnit tests.

## Coding Style & Naming Conventions
- Frontend uses TypeScript and React; follow existing 2-space indentation, PascalCase for components, camelCase for variables, and `*.tsx` for UI files.
- Backend follows Laravel conventions and PSR-12 (4-space indentation); use snake_case for DB tables/columns and PascalCase for classes.
- Formatting/linting: `npm run lint` for frontend; no dedicated PHP formatter configured, so keep to Laravel/PSR-12 style.

## Testing Guidelines
- Frontend tests live under `beldify-frontend/src/**/__tests__/` and use `*.test.tsx` naming.
- Backend tests live in `beldify-backend/tests/` with `*Test.php` naming; use Feature vs Unit suites.

## Commit & Pull Request Guidelines
- Git history only contains the initial commit, so no established message pattern yet.
- Follow repo guidance from `CLAUDE.md`: `type(scope): summary` (e.g., `fix(auth): handle token refresh`).
- PRs should include a clear description, linked issues (if any), test results, and docs updates for behavior/config changes. Add screenshots for UI changes.

## Security & Configuration Tips
- Never commit secrets; use `.env` files and update `.env.example` when new variables are required.
- Key frontend variable: `NEXT_PUBLIC_API_URL`; backend uses standard `DB_*`, `REDIS_*`, and FCM settings.

## Agent-Specific Instructions
- Read `CLAUDE.md` plus `beldify-frontend/CLAUDE.md` and `beldify-backend/CLAUDE.md` before making changes.
- When you change behavior or APIs, update documentation in `docs/` per the doc rules.
