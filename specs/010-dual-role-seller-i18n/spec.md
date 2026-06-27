# 010 — Dual-role seller-buyer navigation: i18n polish + verification

## Problem

Backend + frontend already shipped: sellers with both `customer` + `store_owner` Spatie roles get `is_seller: true` on the profile endpoint; the buyer frontend shows three new seller surfaces (Navbar desktop dropdown link, Navbar mobile drawer pill, profile-page amber shortcut card) plus a VIP-badge fix in ProfileHeader. All four surfaces render correctly but their i18n keys are missing from the 7 locale files, so `react-i18next` falls back to inline `defaultValue` strings — English-only across all locales.

## Scope (in)

- Add `navigation.seller_dashboard` to the top-level `navigation` block of all 7 locale files (`en`, `ar`, `ma`, `fr`, `es`, `nl`, `de`).
- Add `seller.shortcut_title` / `seller.shortcut_body` / `seller.shortcut_cta` to the top-level `seller` block (common namespace) of all 7 locale files.
- Keep existing inline `defaultValue` fallbacks in TSX (codebase-wide defensive pattern).
- Run lint + tsc + build; verify deployed pages render for a dual-role session across locales and RTL/LTR.

## Scope (out)

- No new components, pages, types, or DB/migration changes.
- No changes to Navbar.tsx / profile/page.tsx / ProfileHeader.tsx / auth.ts (already shipped).
- No new API calls or state management.

## Verification

- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- `npm run build:dev` passes (JSON still parses — bad JSON breaks app at module load).
- All 7 locale files are valid JSON containing the 4 new keys.
- Dual-role session on deployed app: seller surfaces visible; switching `?locale=` translates labels with no `missingKeyHandler` warnings; buyer-only session hides all four surfaces.
