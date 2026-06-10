# Frontend completeness audit — 2026-06-10 (evening sweep)

Three parallel read-only auditors swept every storefront surface while wave-1 fixers
(FE-TS / QA-HARNESS / FE-ATLAS / FE-LINT / FE-I18N) repaired tsc/tests/lint/i18n.
This file is the consolidated wave-2 worklist. Status markers updated as fixed.

## P0 — broken flows

1. [x] `src/utils/toast.ts:10-29` — ALL user-facing toasts (success/error/loading) gated
   behind `isDebuggingEnabled()` which is hard-false in production → zero feedback on
   add-to-cart, checkout errors, order placement, coupon, wishlist for real users.
   Fix: only `toast.debug` stays gated.
2. [x] `src/app/profile/components/GeneralSettings.tsx:214` — country `<select>` renders
   only placeholder option; saved country can never display/change. Fix: reuse COUNTRIES
   list from AddressBook.
3. [x] `/placeholder-product.svg` (8 refs) 404 — svg only existed at /images/. FIXED:
   copied to public root. Remaining: 6 refs to `/placeholder-product.jpg` (never existed)
   → repoint to .svg.
4. [x] favicon.ico 404 + icon metadata pointed 192px maskable at 16/32 sizes + missing
   browserconfig.xml. FIXED: layout.tsx icons → real favicon pngs; browserconfig created.
5. [x] `/mega-offers` + `/mega-offers/[slug]` linked from home but no pages existed.
   FIXED: built both pages + shared MegaOfferProductCard (loading/error/empty states,
   Atlas tokens, i18n with fallbacks). Keys need locale entries (see i18n section).

## P1 — visible gaps

### Purchase flow
6. [x] `src/app/orders/[orderNumber]/page.tsx:910-917` — "Write a review" button unwired;
   backend endpoint doesn't exist (services/api.ts:464 TODO). Fix: hide until backend ships.
7. [x] same file 418-424, 733-739, 903-909 — 3× "Contact Support" buttons no onClick.
   Fix: wa.me link pattern from checkout (NEXT_PUBLIC_SUPPORT_PHONE).
8. [x] same file 671-676 — totals panel labels total_amount as "Subtotal", shipping
   hardcoded "Free". Fix: compute items subtotal like invoice page; render shipping_amount.
9. [x] `src/app/checkout/page.tsx:207,1313` — sendUpdates consent checkbox value never
   sent in any of 3 order payloads. Fix: marketing_opt_in in all 3.
10. [x] `src/app/wishlist/page.tsx:54` — add-to-cart uses raw axios, bypasses CartContext
    → navbar badge stale. Fix: useCart().addItem.
11. [ ] `src/services/api/cartService.ts:6` — mergeGuestCart silent no-op stub; verify no
    auth-flow caller relies on it (silent item loss).

### Account / community
12. [x] `src/app/notifications/page.tsx:277-290` — no catch → network error renders as
    "no notifications". Fix: isError state + retry.
13. [x] `src/app/returns/page.tsx:55-59` — auth check reads localStorage token directly.
    Fix: useAuth().
14. [x] `src/app/community/page.tsx:194` — "Your Posts" fetches `/api/v1/community/posts`
    (no such route) → always empty for logged-in users. Fix: communityService.
15. [x] `src/app/community/posts/[id]/page.tsx:136-214` — 5 raw console.warn/error → logger;
    also alert() → toast at 173-175, 200-202.
16. [x] `src/app/community/messages/page.tsx:162` — raw console.warn → logger.

### Seller / services
17. [x] `src/app/shops/[name]/page.tsx:638` — STATIC fake reviews (Sarah M./James L./Amina R.)
    rendered whenever reviewsCount>0. Fix: remove or fetch real ones.
18. [x] same file :53 — STATIC_ATELIERS hardcoded 4 slugs in "Discover more" (may 404).
    Fix: live getShops call.
19. [x] `src/app/services/tailoring/tailors/page.tsx` — filter pills (118), search (131),
    pagination href="#" (299), Clear Filters (231) ALL unwired. Fix: wire state + getTailors.
20. [x] `src/app/services/tailoring/measurements/page.tsx:30-36` — "Add to Cart" only writes
    localStorage but toasts "added to your order". Fix: honest copy or real cart wiring.
21. [x] `src/app/seller/products/[id]/edit/page.tsx` — no delete/archive action for sellers.
22. [x] `src/app/seller/store-settings/page.tsx:248-253` — vertical-save catch still sets
    Saved=true on API failure. Fix: error toast + revert.
23. [x] `src/app/seller/register/page.tsx:108-115` — store_name collected but dropped from
    POST payload.
24. [x] `src/app/terms-of-service/page.tsx:117` — "Seller Terms" links to raw API_BASE_URL.
25. [ ] `src/app/seller/layout.tsx:91` — seller unread badge links to buyer inbox
    /community/messages (no /seller/messages route exists). Backend route gap recorded.

### i18n
26. [x] `src/app/orders/[orderNumber]/invoice/page.tsx:33,41,93,123` — hardcoded
    "Paid"/"Pending"/'Could not load order'/'Order not found'. Fix: t() with fallbacks.
27. [x] `src/app/orders/page.tsx:57-82` + `orders/[orderNumber]/page.tsx:86-113` — reorder
    toasts hardcoded AR+EN ternaries; wire to orders.reorder.* keys (FE-I18N adding keys).
28. [x] `src/app/shipping/page.tsx:11-27` — bare t() without fallbacks → empty strings if
    keys missing.
29. [x] `src/app/checkout/page.tsx:322-332` — payment method t() without fallbacks.
30. [x] megaOffers.* page keys from new /mega-offers pages need entries in 5 locales:
    pageTitle, pageSubtitle, loadError, emptyTitle, emptySubtitle, browseProducts,
    notFoundTitle, notFoundSubtitle, backToOffers, collectionEmpty + common.retry,
    common.breadcrumb, nav.home (verify existing).

## P2 — cosmetic / dead code
31. [x] PDP generic hardcoded artisan paragraph (products/[id]/page.tsx:2027) + sizing
    boilerplate (:2085) rendered for every product.
32. [x] `src/app/api/messages/[shopId]/check/route.ts` — live 501 "Not implemented" route,
    no callers. Delete.
33. [x] `src/app/api/community/responses/[id]/route.ts` + `.../status/route.ts` — fully
    implemented but misleading giant TODO headers + zero UI callers. Clean comments.
34. [x] KEPT (communityService dev branches import them; regression test asserts existence) `src/mocks/mockMessagingData.ts` + `mockReviewsData.ts` — unused. Delete.
35. [x] `src/components/products/ProductGrid.tsx` — dead code (zero imports) with broken
    /product/ link. DELETED.
36. [x] `src/app/shops/[name]/page.tsx` — Reviews tab doesn't scroll to section.
37. [x] Missing static assets referenced: /images/shop-placeholder.png, /images/shops/*
    (6 files), /images/measurement-guide.jpg (size-guide:371, no onError), /images/banners/
    main-banner.jpg. Fix: repoint to existing placeholder or add onError guards.
38. [x] `src/app/size-guide/page.tsx:371` — raw <img> no fallback for missing asset.

## Verified clean (no action)
- Auth pages (login/register/forgot/reset/verify-email), profile, AddressBook,
  SecuritySettings, contact, community create/edit/my-posts/messages thread,
  custom-orders (USE_MOCK=false), seller dashboard/orders/earnings/onboarding,
  static pages content real, sitemap.ts + robots.ts exist, logger gating correct.


## Final status — 2026-06-10 ~20:45
- GATE: tsc 0 errors (was 252) · lint 0 warnings (was 20+) · vitest 1895/1895
  (was 158 failing) · build:prod clean, 80/80 pages, SW bundled.
- OPEN (backend-dependent, frontend honest-stated):
  - #11 cart merge-guest: backend /cart/merge-guest endpoint missing; AuthContext
    call remains a logged no-op — needs backend endpoint then real wiring.
  - #25 /seller/messages: seller unread badge still links to buyer inbox; needs
    seller-scoped messaging surface (backend controller exists).
  - Order review submission endpoint missing on backend (review button hidden
    until it ships).
- INCIDENT: a concurrent session reverted ~1h of uncommitted tracked-file work
  at 19:06 (stash-hazard variant). Mitigation adopted: checkpoint-commit each
  agent packet as it lands.

## Addendum — 21:20: the 3 backend-dependent gaps CLOSED
- #11 guest-cart merge: BE bb8ef5e3 + FE wiring (idempotent, cart:refresh event).
- #25 seller messages: BE e0710ab6 (incl. role-guard + ownership-gate security
  fixes on /api/v1/backend/messages/*) + FE /seller/messages list+thread pages.
- Order reviews: BE 472b6f06 (order-scoped status+submit, moderation pending)
  + FE per-item star modal on delivered orders.
Nothing from the audit remains open.
