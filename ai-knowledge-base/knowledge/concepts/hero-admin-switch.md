---
name: Hero Admin Switch
description: "The Beldify home hero is admin-switchable between the static brand hero and a hybrid campaign carousel, driven by a hero.mode setting and the pre-existing banner system"
type: concept
tags: [migration, model, deploy, category, pattern, cache, atlas, design-system, search]
sources:
  - sources/2026-06-10-hero-admin-switch
  - raw/2026-06-10-admin-audit-sellers-jewelry-deploy.md
created: "2026-06-10"
updated: "2026-06-10"
---
# Hero Admin Switch

The Beldify storefront home hero supports two admin-selectable modes. `brand` (default) renders the static editorial hero — Darija headline, search bar, CTAs — exactly as designed in the marketplace overhaul. `campaign` renders a hybrid Swiper carousel whose first slide is that same brand hero and whose subsequent slides are admin-managed banners (full-bleed image, localized title/subtitle, amber CTA chip honoring `text_position`). The mode lives in a `hero_settings` key/value table behind the `HeroSetting` model, a clone of the `AiSetting` DB-backed settings pattern without encryption, and is toggled from a card on the existing `/admin/banners` page.

The public contract is `GET /api/hero-config` → `{mode, banners[]}`, served by `App\Http\Controllers\API\HeroConfigController` with localized banner fields and a 300-second per-locale cache (`hero_config_<locale>`), busted on mode changes and banner CRUD alongside the existing `hero_banners` cache. The frontend fetches it server-side inside the home payload with `revalidate: 60` and degrades to `{mode:'brand', banners:[]}` on any error, so a backend outage or empty banner set is visually indistinguishable from brand mode — the carousel can never break the home page.

The feature reused the dormant banner system end to end (model, service, admin CRUD); the only substantive new backend behavior besides settings is that banner image uploads and URL generation moved from the revoked Contabo S3 to the local public disk, following the category-image pipeline's `ASSET_URL` pattern.

**Deployed live 2026-06-10 evening**: the backend half (37 files + `hero_settings` migration) reached production via git-archive-over-ssh and the smoke `GET /api/hero-config` returned `{"mode":"brand","banners":[]}` — with the frontend already shipped as build #7, the feature is fully live end-to-end ([[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]]).

## See also
- [[sources/2026-06-10-hero-admin-switch]]
- [[concepts/category-image-pipeline]]
- [[concepts/caching-strategy]]
- [[concepts/atlas-design-system]]
- [[concepts/home-merchandising-roadmap]]
- [[sources/2026-06-10-admin-audit-sellers-jewelry-deploy]]
