---
name: Beldify completeness audit (overnight 2026-06-10)
description: 38-section feature-completeness matrix benchmarked against multi-vendor checklists and Moroccan competitors, plus prod health snapshot, six overnight fix packets, and a 12-item roadmap to #1 Moroccan marketplace
type: source
sources: [raw/2026-06-10-completeness-audit.md]
created: 2026-06-10
updated: 2026-06-10
---

# Beldify completeness audit (overnight 2026-06-10)

## Summary
Overnight audit benchmarking Beldify against multi-vendor marketplace feature checklists (CS-Cart, Yo-Kart, Clarity 2026 guides) and Moroccan caftan/beldi competitors (Beldyness, Caftanni, Taoufik Moda, Boksha, Jumia.ma traditional wear). It produces a 38-section status matrix, a prod health snapshot, six fix packets dispatched to specialists the same night, and a 12-step priority roadmap. The competitor "behoutry" could not be identified online under any spelling.

## Key points
- **Prod health (01:10)**: homepage 200 (0.88s via Cloudflare), `/api/health` healthy, all containers up, disk 37%. Active prod-log errors: `community_posts.status` enum truncation, `admin.marketplace.stores.show` undefined route (both fixed in 4 unpushed commits on `fix/opensouk-tag-notify`), daily-log permission denied. `/api/products/featured` → 500: `ProductController::fetchFeatured` does not exist (route still references it; frontend no longer calls it). Prod backend tree shows junk commits ("ok", "need") — rsync-managed, lags local main.
- **Complete (✅)**: auth core, catalog browse/filters (LIKE search only), PDP (hybrid stock), cart, checkout (COD + transfer + guest buy-now), notifications infra (but no scheduler), buyer↔seller chat (Reverb/soketi live), Open Souk, seller registration/onboarding, seller orders/earnings, PWA + Web Push (serwist SW + VAPID), tests (90 backend + 81 frontend test files).
- **Broken/partial (🟠)**: password reset (no `/reset-password` confirm page), Google login (client id unset everywhere), search UX (Navbar → `/search?q=` 404s; working route is `/products?q=`), reviews (no verified-purchase check), wishlist (add-to-cart sends `stock_id: productId`), orders lifecycle (no buyer cancel on web API), coupons (only CartRecoveryCoupon; MegaOffers frontend uses 18 Unsplash placeholders), seller product mgmt (no edit/delete page), seller store settings (UI saves via `setTimeout`, never calls the existing `PUT /api/seller/store-profile`), seller messages (no `/seller/messages` route), shipping (flat fee; ShippingMethod model unused), legal pages (contact form no-op, `/faq` vs `/faqs` dead link), i18n (FAQs hardcoded EN), SEO (no sitemap.xml, no Product JSON-LD).
- **Missing (🔴)**: email verification, SMS/OTP, online payment gateway (mobile PaymentController fully mock), returns/refunds flow, PDF invoices, admin coupon/flash-sale CRUD, seller payouts self-service, marketing loops (engines exist but no scheduler → never fire), scheduled jobs (zero `Schedule::` calls), accounting/vouchers (dead-code stubs).
- **Security hygiene (⚠️)**: backend `.env` (15.8k lines, VAPID private key, DB creds) is git-tracked; 7 `.bak` controller files committed.
- **Notable cross-cutting finding**: notification/growth engines (cart recovery, price-drop, back-in-stock) existed but nothing fired automatically because no scheduler was wired.
- **Fix packets dispatched overnight**: BE-1 storefront API completion (forgot/reset password, contact, buyer cancel, return-request, fetchFeatured restore), BE-2 growth-engine activation (scheduler wiring, general Coupon CRUD, cart discount TODO), FE-1 storefront quick wins (search route, dead links, wishlist id, MegaOffers/jewelry real data, Google guard, sitemap + JSON-LD), FE-2 auth+trust flows, FE-3 seller dashboard completion, ADMIN-1 admin KPI correctness.
- **Roadmap (priority order)**: 1 CMI online payments, 2 SMS OTP, 3 returns+refunds console, 4 seller payouts self-service, 5 referral + loyalty, 6 full-text faceted search (Meilisearch), 7 PDF invoices, 8 shipping zones + Amana/CTM tracking, 9 address book, 10 email verification + account security, 11 flash-sale scheduling UI, 12 seller analytics.

## See also
- [[concepts/marketplace-completeness-roadmap]]
- [[concepts/multi-seller-ecommerce]]
- [[sources/2026-06-10-backlog-make-later]]
- [[sources/ecommerce-gap-analysis-2026-06-03]]
- [[entities/beldify]]
