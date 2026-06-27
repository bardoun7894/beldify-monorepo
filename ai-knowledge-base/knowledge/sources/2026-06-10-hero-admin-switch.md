---
name: Hero admin switch — hybrid carousel implementation log
description: "Admin-switchable home hero shipped on feat/hero-admin-switch — hero.mode setting, /api/hero-config endpoint, hybrid Swiper carousel, banner uploads moved to local disk"
type: source
tags: [laravel, migration, model, nextjs, fetch, deploy, category, rtl, ux, search]
sources: [raw/2026-06-10-hero-admin-switch.md]
created: "2026-06-10"
updated: "2026-06-10"
---
# Hero admin switch — hybrid carousel implementation log

## Summary
Implementation log for the admin-switchable home hero (2026-06-10). The user wanted a Homzmart-style campaign hero with an admin toggle between custom hero images and the existing brand hero; the chosen design is a hybrid carousel (slide 1 = brand hero with search, slides 2+ = admin banners). A complete but unused banner system already existed in the backend, so the feature was wiring rather than building. Shipped on `feat/hero-admin-switch` in both repos; not merged or deployed at time of writing.

## Key points
- Pre-existing unused infrastructure: `Banner` model (bilingual fields, scheduling, position), `BannerService::getActiveHeroBanners()`, admin CRUD at `/admin/banners`, frontend `bannerService`, `swiper@11` installed.
- Backend (dc64df2a): `hero_settings` key/value table + `HeroSetting` model (AiSetting clone, no encryption); public `GET /api/hero-config` returning `{mode, banners[]}` localized, cached `hero_config_<locale>` 300s; "Hero Mode" toggle card on `/admin/banners` (`PUT /admin/hero-settings`, permission `manage_content`); 17/17 feature tests.
- Banner image upload + URL generation migrated off the dead Contabo S3 to the local public disk, mirroring the category-image migration (`7e80941a`); legacy absolute URLs pass through.
- Frontend (fec9f74): `BrandHeroSlide` = exact extraction of the old hero; `HeroSection` renders brand hero for mode=brand/zero banners, Swiper hybrid carousel for campaign (autoplay 6s, amber dots, RTL-aware, reduced-motion safe); fetch falls back to `{mode:'brand', banners:[]}` on any error; 47/47 new tests, suite ≤ baseline.
- Gotchas: `text_position` enum allows only left|right ('center' needs a migration); deploy needs backend migrate + opcache restart, frontend prod-compose rebuild, and an intact `storage:link`.
- Shared-tree contamination: concurrent sessions committed e4b01186 (backend notifications fix) and a378cff (monorepo purchase UX) onto the checked-out feature branches mid-build.

## See also
- [[concepts/hero-admin-switch]]
- [[concepts/category-image-pipeline]]
- [[concepts/caching-strategy]]
- [[entities/laravel]]
- [[entities/nextjs]]
