---
name: specs/010-dual-role-seller-i18n/tasks.md
description: Auto-synced from specs/010-dual-role-seller-i18n/tasks.md
type: source
sync_origin: specs/010-dual-role-seller-i18n/tasks.md
sync_hash: b4088f85a94e5697
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/010-dual-role-seller-i18n/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks — 010 Dual-role seller-buyer i18n polish

- [x] 1. Add `navigation.seller_dashboard` to all 7 locale files (en, ar, ma, fr, es, nl, de)
- [x] 2. Add `seller.shortcut_title`, `seller.shortcut_body`, `seller.shortcut_cta` to all 7 locale files
- [x] 3. JSON validity check (all 7 files parse, 4 keys present under correct parents)
- [x] 4. `npm run lint` — ✔ No ESLint warnings or errors
- [x] 5. `npx tsc --noEmit` — 21 pre-existing errors (baseline-confirmed, zero introduced by this phase; `ignoreBuildErrors:true`)
- [x] 6. `npm run build:dev` — ✓ Compiled successfully, 86/86 static pages
- [x] 7. Deploy verification: HTTP 200 on /profile and /seller/signup, container healthy, i18n keys present at correct JSON paths on server, curl confirms response

## Done history

- [x] Backend roles (`customer` + `store_owner` Spatie) — prior phase
- [x] `is_seller?: boolean` on `User` type (`src/types/auth.ts`) — prior phase
- [x] Navbar desktop dropdown + mobile drawer seller link — prior phase
- [x] Profile amber shortcut card — prior phase
- [x] ProfileHeader VIP badge `user_type_id === 2 || is_seller === true` — prior phase
- [x] Deploy to production (HTTP 200 on `/profile` and `/seller/signup`) — prior phase

