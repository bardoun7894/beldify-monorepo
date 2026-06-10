# Beldify Completeness Audit — 2026-06-10 (overnight session)

Benchmarked against: multi-vendor marketplace feature checklists (CS-Cart, Yo-Kart, Clarity 2026 guides), Moroccan caftan/beldi competitors (Beldyness, Caftanni, Taoufik Moda, Boksha, Jumia.ma traditional wear), and the mostaql-style request/proposal model Beldify already uses for Open Souk. ("behoutry" could not be identified online under any spelling — EN/AR variants searched; ask user for the exact name/URL.)

## Prod health snapshot (read-only, 01:10)

- Homepage 200 (0.88s via Cloudflare), `/api/health` healthy, all containers up, disk 37%.
- ACTIVE errors in prod log: `community_posts.status` enum truncation (admin moderation), `admin.marketplace.stores.show` undefined route, daily-log file permission denied. First two are FIXED in 4 unpushed commits on `fix/opensouk-tag-notify` — need deploy + migration.
- `/api/products/featured` → 500: `ProductController::fetchFeatured` does not exist (lost in history; route still references it). Frontend no longer calls it, but route is public and broken.
- Prod backend tree git log shows junk commits ("ok", "need") — prod is rsync-managed, lags local main.

## Section-by-section matrix

| # | Section | Status | Key evidence |
|---|---------|--------|--------------|
| 1 | Auth core (register/login/logout) | ✅ COMPLETE | API + web + mobile |
| 2 | Password reset (storefront) | 🟠 BROKEN E2E | `/forgot-password` UI exists; **no `/reset-password` confirm page**; no non-mobile API endpoints |
| 3 | Email verification | 🔴 MISSING (UI + API routes) | model column exists only |
| 4 | Social login (Google) | 🟠 DEAD | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset everywhere; button silently fails |
| 5 | SMS/OTP | 🔴 MISSING | OTP send line commented out; no provider |
| 6 | Catalog browse/filters | ✅ COMPLETE (LIKE search only) | facets/full-text missing |
| 7 | Search UX | 🟠 BROKEN | Navbar → `/search?q=` 404s; working route is `/products?q=` |
| 8 | PDP (variants/stock/gallery/related) | ✅ COMPLETE | hybrid stock shipped 06-05 |
| 9 | Reviews & ratings | ✅ mostly | no verified-purchase check; mobile controller is mock |
| 10 | Cart | ✅ COMPLETE | coupon discount not subtracted in `updateCartTotals` (TODO) |
| 11 | Wishlist | 🟠 PARTIAL | add-to-cart sends wrong id (`stock_id: productId`) |
| 12 | Checkout (COD + transfer + guest buy-now) | ✅ COMPLETE | guest full-cart checkout missing; address book missing (mobile controller is mock) |
| 13 | Online payment gateway (CMI/Stripe) | 🔴 MISSING | mobile PaymentController fully mock |
| 14 | Orders lifecycle (web) | 🟠 PARTIAL | no buyer cancel endpoint on web API; tracking numbers have no admin entry UI; no carrier integration |
| 15 | Returns/refunds | 🔴 MISSING flow | policy page only; no return request form/API; no admin refund mgmt |
| 16 | Invoices (PDF) | 🔴 MISSING | no dompdf, no endpoint |
| 17 | Coupons/promotions | 🟠 PARTIAL | only CartRecoveryCoupon; SpecialOfferController hardcoded mock; MegaOffers real in backend, frontend uses 18 Unsplash placeholders |
| 18 | Notifications (email/in-app/push) | ✅ infra COMPLETE | **but NO scheduler — nothing fires automatically**; FCM removed, VAPID webpush live |
| 19 | Buyer↔seller chat | ✅ COMPLETE | Reverb/soketi live on prod; buyer thread page real-time |
| 20 | Open Souk (request+blind bids) | ✅ COMPLETE | secondary buyer routes deferred |
| 21 | Seller registration/onboarding | ✅ COMPLETE | |
| 22 | Seller product mgmt | 🟠 PARTIAL | **no edit/delete page** (create only) |
| 23 | Seller orders/earnings | ✅ COMPLETE | |
| 24 | Seller store settings | 🟠 FAKE SAVE | UI saves via `setTimeout`, never calls `PUT /api/seller/store-profile` (endpoint exists) |
| 25 | Seller payouts | 🔴 MISSING self-service | commissions computed; no withdrawal request flow |
| 26 | Seller messages inbox | 🟠 PARTIAL | no `/seller/messages` route; relies on community messages |
| 27 | Admin dashboards/mgmt | ✅ mostly | no refund mgmt; reports thin; 2 admin 500s fixed locally, undeployed |
| 28 | Admin coupon/flash-sale mgmt | 🔴 MISSING | no general coupon CRUD |
| 29 | Shipping zones/fees | 🟠 PARTIAL | flat fee; ShippingMethod model unused by checkout |
| 30 | Legal/static pages | 🟠 PARTIAL | ToS/privacy/shipping ok; contact form is no-op `setTimeout`; FAQ link dead (`/faq` vs `/faqs`); journal/careers/press dead links |
| 31 | i18n | 🟠 PARTIAL | 5 locales near-parity; FAQs hardcoded EN; order pages have FLAG'd literals; backend dual-column EN/AR only |
| 32 | PWA + Web Push | ✅ COMPLETE | serwist SW + VAPID + install prompts |
| 33 | SEO | 🟠 PARTIAL | no sitemap.xml route, no Product JSON-LD |
| 34 | Marketing/growth loops | 🔴 MISSING | engines exist (cart recovery, price-drop, back-in-stock notifications) but no scheduler → never fire; no referral; no flash-sale scheduling |
| 35 | Scheduled jobs/queues | 🔴 MISSING | zero Schedule:: calls in app |
| 36 | Accounting/vouchers | 🔴 DEAD CODE | VoucherController/AccountingController stubs |
| 37 | Tests | ✅ STRONG | 90 backend + 81 frontend test files |
| 38 | Security hygiene | ⚠️ | `.env` (15.8k lines, VAPID private key, DB creds) is git-tracked; 7 `.bak` controller files committed |

## Tonight's fix packets (dispatched to specialists)

- **BE-1**: storefront API completion — forgot/reset password endpoints, contact endpoint, buyer cancel, return-request, fetchFeatured/featuredSections restore. + tests.
- **BE-2**: growth engine activation — Laravel scheduler wiring (cart-recovery, price-drop, back-in-stock), general Coupon model/service/admin CRUD, cart discount TODO fix. + tests.
- **FE-1**: storefront quick wins — search route fix, dead links, wishlist id fix, MegaOffers real data, jewelry real data, Google button guard + env plumbing, sitemap + Product JSON-LD.
- **FE-2**: auth+trust flows — reset-password page, contact wiring, returns request UI, cancel/return buttons on order detail.
- **FE-3**: seller dashboard completion — product edit page, store-settings real save, seller messages entry, dashboard polish.
- **ADMIN-1**: admin dashboard improvements (Blade, v3 components) — KPI correctness + polish.

Deferred to roadmap (too big/too risky overnight): CMI/Stripe gateway, SMS provider, full-text search (Scout+Meilisearch), PDF invoices, seller payout requests, shipping zones, referral program, loyalty/streaks, email verification flow, admin refund console, address book API.

## Roadmap — "what to add to be #1 Moroccan marketplace" (priority order)

1. **CMI online payments** (+ keep COD dominant; 3D Secure) — unlocks card buyers.
2. **SMS OTP (e.g., Twilio/Infobip local aggregator)** — phone-first Moroccan users.
3. **Returns + refunds console** — trust parity with Jumia.
4. **Seller payouts self-service** — seller retention.
5. **Referral program + loyalty points (souk streaks)** — growth loops on top of tonight's scheduler.
6. **Full-text faceted search** (Meilisearch) — discovery.
7. **PDF invoices** (dompdf) — professionalism + B2B.
8. **Shipping zones + Amana/CTM carrier tracking** — delivery transparency.
9. **Address book** — repeat-purchase conversion.
10. **Email verification + account security page** — abuse control.
11. **Flash-sale scheduling UI on MegaOffers** — urgency mechanics.
12. **Seller analytics (product views→sales funnel)** — marketplace stickiness.
