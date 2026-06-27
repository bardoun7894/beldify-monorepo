---
name: Open Souk Feature
description: Community reverse-marketplace renamed to "Open Souk / السوق المفتوح" with full Darija localization and a seller-side Freelancer-style browse/bid/track UX
type: concept
tags: [laravel, php, blade, response, nextjs, state, seller, buyer, category, atlas]
sources: [daily/2026-05-21.md, daily/2026-05-24.md]
created: "2026-05-21"
updated: "2026-05-24"
---
# Open Souk Feature

## Overview
The Beldify community page is a reverse-marketplace where buyers post tailoring briefs and ateliers (workshops) compete by responding. On 2026-05-21 it was renamed from the generic "Community" label to "Open Souk / السوق المفتوح / Souk Ouvert" across every user-visible surface. The feature copy was fully localized into Darija (Moroccan Arabic colloquial) to establish a strong local identity.

## Key Points
- **Feature identity**: "Open Souk / السوق المفتوح / Souk Ouvert" — bilingual EN+Darija+FR naming
- **Hero eyebrow**: `السوق المفتوح`; **headline**: `انشر طلبك. الأتيليهات تجيك.`; **subtitle**: references Tetouan ateliers competing for briefs
- **AI chip label**: `الذكاء الصناعي كيترجم طلبك للعربية · الإنجليزية · الفرنسية`
- **Primary CTA**: amber `بَلِّغ في السوق المفتوح` button
- **Helper card**: retitled `شنو هو السوق المفتوح؟` with 5 Darija steps + tip
- **Empty state**: `السوق مفتوح / كن أول واحد ينشر طلب — الأتيليهات كتشوف.`
- **Footer bottom strip**: `© Beldify 2026. مصنوع بفخر فالمغرب.`

## Details
The rename touched all user-visible surfaces of the community feature: the hero band, the helper card, CTAs, the empty state, and the footer bottom strip. All strings use Darija rather than formal Modern Standard Arabic to match Beldify's local Moroccan marketplace voice.

A footer regression was discovered during this work: `KEY 'FOOTER.COMPANY (MA)' RETURNED AN OBJECT INSTEAD OF STRING`. The root cause was four heading keys in `Footer.tsx` (`company`, `sellers`, `help`, plus a `contactLink` entry) that collided between the Darija locale's object-shaped footer column definitions and flat string lookup. The fix renamed four heading keys to `headingSellers`, `headingCompany`, `headingHelp`, `contactLink` in `Footer.tsx` and added 22 flat translations across en/ar/ma/fr locale files. After the fix, all four footer columns render in Darija: تسوّق / البايعين / الشركة / المساعدة.

### Remaining English in shared chrome (out of Open Souk scope)
The following inline literals were intentionally left for a separate chrome-localization pass:
- Top announcement strip (`app/page.tsx` RSC — inline literal, not behind `t()`)
- Navbar nav labels (Fashion / Home & Decor / Jewelry / Tailoring / Journal)
- Footer brand description ("A curated marketplace for authentic Moroccan fashion...")

### Community backend seeder
`CommunitySeedWithDarija.php` already existed in the backend and was registered in `DatabaseSeeder`. Three community posts and three responses were seeded on the local backend (MyContabo) for development testing.

## Seller-Side UX (added 2026-05-24)

The buyer-facing Open Souk page existed before 2026-05-24 but sellers (ateliers) had no dedicated UI to browse posts and submit proposals. The seller-side UX was built as a Freelancer-style three-screen flow inside the [[concepts/seller-shell-layout]]:

### Three views (1788 → 450 total lines after rewrite)
1. **`seller/community/index.blade.php`** — Browse: 3-column card grid of open buyer briefs; each card shows title, budget range, deadline, and response count; filter by category; translated in 4 locales
2. **`seller/community/show.blade.php`** — Detail + sticky proposal form: buyer brief full description, existing responses count, sticky right-column bid form (price + message + estimated delivery); Atlas indigo/amber tokens
3. **`seller/community/responses.blade.php`** — My proposals tracker: tabbed (Pending / Accepted / Rejected); each row shows brief title, bid amount, submission date, and status badge

### Navigation surface
Open Souk is the 4th tab in the seller shell bottom navigation (storefront icon), surfaced to all sellers regardless of store-approval status (browsing is open; bidding requires approved store).

### Sidebar rename
In the admin V3 sidebar, the "Community" section label was renamed to "Open Souk" (`السوق المفتوح` in AR, `Souk Ouvert` in FR, `Souk` in MA locale) for brand alignment — applied as part of the 2026-05-24 sidebar translation pass.

## Related Concepts
- [[concepts/atlas-design-system]] — Indigo + amber Atlas tokens used throughout the hero band and CTAs
- [[concepts/seller-shell-layout]] — The mobile-first layout hosting the seller-side Open Souk views
- [[concepts/multi-seller-ecommerce]] — The marketplace context this reverse-brief feature serves
- [[concepts/beldify-admin-v3-sidebar]] — Sidebar where the Community section was renamed to Open Souk
- [[entities/beldify]] — The platform this feature belongs to
- [[entities/nextjs]] — Framework where the buyer-facing community page is implemented
- [[entities/laravel]] — Framework where the seller-side Blade views are implemented

## Sources
- [[daily/2026-05-21.md]] — Feature renamed; hero band fully localized in Darija; helper card retitled; footer regression found and fixed; 4-locale translation additions landed
- [[daily/2026-05-24.md]] — Seller-side UX added: 3-view Freelancer-style browse/bid/track flow (1788→450 lines); seller shell integration as tab 4; admin sidebar Community → Open Souk rename
