# Hero admin switch — hybrid carousel (2026-06-10)

User wanted Homzmart-style campaign hero + admin toggle between custom hero images and the brand hero. Chose HYBRID: slide 1 = brand hero (Darija statement + search), slides 2+ = admin banners.

## Key discovery
A full banner system already existed and was unused by the hero: `Banner` model (bilingual title/subtitle/CTA, is_active, position, text_position, start/end dates), `BannerService::getActiveHeroBanners()` (cache 'hero_banners'), admin CRUD `/admin/banners` (permission manage_content), frontend `bannerService.getHeroBanners()`, `swiper@11` installed. Feature = wiring, not building.

## What shipped (NOT merged/deployed yet)
Backend `feat/hero-admin-switch` @ dc64df2a (base main 7f6e86d0):
- `hero_settings` key/value table + `HeroSetting` model (AiSetting clone, no encryption). Key `hero.mode` ∈ brand|campaign, default brand.
- `GET /api/hero-config` (public, App\Http\Controllers\API\HeroConfigController) → `{mode, banners[{id,title,subtitle,button_text,button_link,image_url,text_position}]}`, localized accessors, `Cache::remember('hero_config_<locale>', 300)`; cache busted by mode change + BannerService::clearCache.
- Admin: "Hero Mode" card on /admin/banners index + `PUT /admin/hero-settings` (manage_content). AR/EN lang keys.
- Banner uploads + image_url migrated off DEAD Contabo S3 → local public disk (mirrors category-image migration 7e80941a); legacy absolute URLs pass through.
- 17/17 feature tests (51 asserts). Gotcha: `text_position` enum is left|right only — 'center' needs a migration.

Frontend monorepo `feat/hero-admin-switch` @ fec9f74 (base white-canvas 9e97523):
- `BrandHeroSlide.tsx` = exact extraction of old hero (zero visual change). `HeroSection.tsx` = mode logic + Swiper (Autoplay 6s pauseOnMouseEnter, amber-500/white-40 dots via inline style — Swiper CSS specificity, prefers-reduced-motion disables autoplay, text_position → logical start/end/center so RTL flips).
- `home/route.ts` fetches /api/hero-config with revalidate:60, catch → {mode:'brand',banners:[]} (backend outage = invisible fallback).
- i18n carousel keys ×5 locales. 47 new tests green; 4 pre-existing test files re-pointed HomeContent→BrandHeroSlide; suite 158 failed ≤ 160 baseline; lint+build clean.

## Deploy checklist (when shipping)
1. Backend: `php artisan migrate` (hero_settings) + container restart (opcache). 2. Frontend: prod compose rebuild (server component change). 3. Banner uploads land on public disk → verify `storage:link` after any rsync (known prod gotcha). 4. Flip mode: Admin → Banners → Hero Mode → campaign; add banners with images there.

## Shared-tree contamination (flag at merge)
Concurrent sessions committed onto BOTH checked-out feature branches mid-build: backend e4b01186 (notifications fix), monorepo a378cff (purchase UX). Content desirable but branches are not feature-pure. Also concurrent session is actively replacing hero-atelier.jpg/hero-bg-*.jpg in the working tree (uncommitted).
