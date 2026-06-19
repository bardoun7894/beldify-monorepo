# Homzmart vs Beldify home page — competitive design analysis (2026-06-10)

Live-browsed https://homzmart.com (desktop 1440 + mobile 547) and https://beldify.com (desktop 1440), cross-referenced with the post-overhaul home code (`HomeContent.tsx`, `DiscoverFeed.tsx`, `FeaturedSections.tsx`, `PostCard.tsx`).

## Homzmart design system (observed)

- **Background**: pure white `rgb(255,255,255)` everywhere, Roboto. Sections separated by whitespace + full-width promo banners, NOT background color shifts.
- **Header stack (3 sticky layers)**:
  1. Red promo marquee bar — rotating offers + promo code (`FF20`, ValU 36-month 0% financing).
  2. Navy header — logo, deliver-to-country selector, large centered white search bar, account/wishlist/cart, EN toggle.
  3. White merchandising nav — category labels each WITH a small product photo thumbnail + animated red "عروض مهرجان الأثاث" badge. On mobile this becomes photo tiles pinned under the header — visible during the entire scroll.
- **Hero = campaign carousel**, not brand statement: full-bleed marketing banners (festival sale art, financing offers), arrows + dots, single "اشتري الآن" chip. Admin/campaign-driven space.
- **Category circles rail** under hero (photo circles, arrows, scrollable).
- **"تسوق حسب الغرفة"** — shop-by-room mental model (room tiles), not just product-type taxonomy.
- **Product rails** with benefit-led Arabic titles ("الراحة تبدأ مع كنب ركنة"), view-more + carousel arrows, 5-up desktop / 2-up mobile.
- **Product cards = mini-PDPs**: white, ~12px radius, thin border, LANDSCAPE lifestyle room-scene photos (product in context), wishlist heart, "متوفر" availability badge, title, rating ★ + count, "تبدأ من" starts-from price, strikethrough original + discount %, variant chips ("4 المقاسات، 2 نوع").
- **Rhythm**: rail → full-width campaign banner → rail → banner. Mid-page banners re-sell installments.
- **Department zones**: kids zone = banner + collage category tiles (furniture/toys/care/strollers) + product rail — a mini department-store landing inside home.
- **Footer**: light blue, payment method logos, app store badges, social.

## Beldify current state (live, post-overhaul)

- Warm parchment `#fbf9f4` canvas, indigo-950 hero/CTAs, amber accents — more editorial/branded than Homzmart. KEEP.
- Hero: static Darija brand statement + search + 2 CTAs. No campaign surface, no carousel. Hero photo not visible on desktop (flat slate render; known backlog: western-suit photo).
- **P0 finding: the page is image-starved.** Live desktop shows: ~half the category chips are blank cream circles, category editorial grid tiles are gradient placeholders, best-seller / جديد السوق product cards render with BLANK white image areas (dead Unsplash seed IDs — known backlog), Journal 2/3 images dead, DiscoverFeed renders as endless cream skeletons. Homzmart's entire effect comes from wall-to-wall real lifestyle photography; no layout change matters until imagery is fixed.
- Unique differentiators Homzmart has nothing like: OpenSouk (reverse marketplace, indigo full-bleed 3-step), tailoring-on-measure CTA, طلبات جديدة community rail, Journal, ateliers.
- Cards: white + `ring-amber-200/50`, aspect-[3/4] portrait, price indigo. FeaturedSections has ratings; DiscoverFeed has discount badge; no variant chips, no starts-from pricing, no availability badge.

## Recommendations (keep Atlas colors + OpenSouk identity)

**Phase 0 — content, the real gap (P0):** real product/category/hero photography (traditional Moroccan wear, lifestyle shots in riad/atelier contexts mirroring Homzmart's room-scenes). Fix dead seeds, cat_18 dup, hero-atelier.jpg. Nothing else moves the needle until this lands.

**Phase 1 — merchandising layer (structure adopted from Homzmart, recolored Atlas):**
1. Promo marquee bar above header: indigo-950 bg, amber text, rotating offers/codes (already have free-delivery-over-500 line — make it a marquee with multiple messages).
2. Sticky mobile category tiles (photo tiles pinned under header, like Homzmart) + "عروض" animated badge slot. Desktop: add thumbnails to category nav items.
3. Card upgrade to mini-PDP: rating+count everywhere, "يبدأ من" starts-from price for multi-variant/tailoring items, variant chips ("3 قياسات، 4 ألوان"), strikethrough + % off, availability badge, wishlist heart. Keep white + amber ring + indigo price.

**Phase 2 — campaign surfaces:**
4. Hero → carousel: slide 1 keeps the Darija brand statement + search; slides 2-3 = admin-managed campaign banners (Eid/wedding season, tailoring promo, OpenSouk awareness) with CTA chip + dots.
5. Mid-page full-width campaign banners between rails (indigo/amber brand art, not Homzmart red).

**Phase 3 — mental models + zones:**
6. "تسوق حسب المناسبة" occasion grid (Beldify's analog of shop-by-room): العرس، العيد، الصيف، اليومي، الهدايا.
7. Department zones like Homzmart kids: "ركن العرس" (banner + takchita/caftan/jewelry/accessory collage tiles + rail), jewelry vertical zone.
8. Benefit/occasion-led Darija rail titles (already good: "اللي كيتباعو كثر"; extend: "جاي العيد؟").

**OpenSouk special treatment (differentiator — make it MORE distinct, never flatten):**
9. Keep it the only indigo full-bleed band; lean into Moroccan identity (zellige/starburst pattern bg).
10. PostCard → trading-floor energy: pulsing live "X عروض" count (proposal count is public per blind-bidding model), amber budget chip, freshness/time-left, category icon, "قدّم عرضك" CTA.
11. Optional: horizontal auto-scroll ticker of latest requests for souk liveliness.

**Do NOT copy:** white background (parchment is brand), red promo color (use amber/indigo), Roboto, removing editorial sections (Journal/ateliers are differentiation).

Also tied to backlog: category cache perpetually cold, DiscoverFeed skeleton stall on prod.

## Implementation note (same day, 14:40)

User confirmed: likes Homzmart's simplicity, dislikes the amber/parchment canvas. Best-practice research (Baymard, PathEdits, BrainSpate) confirmed white/near-white canvas + brand-color-as-accent for product-heavy marketplaces.

Shipped on `feat/white-canvas-tokens` (9e97523, 117 files), building on concurrent-session commits afbe532 (washes) + 9f437d5 (tokens):
- All `ring/border/divide-amber-{50,100,200,300}` hairlines → gray equivalents (~700 instances).
- `bg-amber-50/xx` washes → `bg-gray-50`; amber page canvases → `bg-background`; amber skeletons (`bg-amber-100/70`, `animate-pulse bg-amber-100`) → `bg-gray-100`.
- Tailwind `canvas` #FAFAF7 → #FCFCFC (matches `--background` 0 0% 99%).
- Amber kept accent-only: 38 amber-filled chips/dropzones got their amber rings RESTORED (gray ring on amber fill mismatches); 2 intentional `focus-visible:ring-amber-300` preserved.
- DESIGN.md §2 palette: neutral canvas row, gray-200 hairlines, 60-30-10 rule; amber-50 = accent-only.
- 5 stale design tests updated (cart/orders/shipping/pdp/tailoring-profile atlas tests asserted the old amber spec; orders test had asserted gray was "off-palette" — inverted).
- Verification: vitest 160 pre-existing failures (baseline 161, zero new), lint clean, `next build` clean, dev-server visual check confirmed neutral canvas.

GOTCHA for next session: `main` was rewound from 9f437d5 → afbe532 by a concurrent session mid-work; 9f437d5 is only reachable via `feat/white-canvas-tokens`. Merge this branch to main to restore it.
