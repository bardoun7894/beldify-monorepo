---
name: Homzmart vs Beldify home page — competitive design analysis
description: Live-browse comparison of homzmart.com vs beldify.com home pages — imagery is the real gap; phased merchandising adoption plan keeping Atlas colors and OpenSouk identity
type: source
tags: [migration, request, effect, shop, product, category, atlas, design-system, theme, color]
sources: [raw/2026-06-10-homzmart-vs-beldify-home-analysis.md]
created: "2026-06-10"
updated: "2026-06-10"
---
# Homzmart vs Beldify home page — competitive design analysis

## Summary
Side-by-side live-browse analysis (2026-06-10) of homzmart.com (Egyptian furniture marketplace, desktop + mobile) against beldify.com's post-overhaul home page, cross-referenced with the home page code. Homzmart's effect comes from a pure-white canvas, a 3-layer sticky merchandising header, a campaign-carousel hero, and wall-to-wall lifestyle photography in mini-PDP product cards. Beldify's biggest gap was imagery (dead seeds and blank placeholders), not layout. The analysis fed two shipped outcomes: the neutral-canvas theme migration and the admin-switchable hybrid hero.

## Key points
- Homzmart: white `rgb(255,255,255)` body; sections separated by whitespace and full-width campaign banners, not background shifts; red promo marquee + navy header + photo-thumbnail category nav, all sticky (photo tiles pinned on mobile).
- Homzmart hero is an admin/campaign carousel (financing offers, festival sales, promo codes), not a brand statement; rhythm is rail → banner → rail; "department zones" (e.g. kids) act as mini landings inside home.
- Homzmart product cards are mini-PDPs: landscape lifestyle photos, availability badge, rating + count, "تبدأ من" starts-from pricing, strikethrough + discount %, variant chips.
- Beldify P0 finding: live page was image-starved — blank category chips, placeholder grid tiles, blank product card images (dead Unsplash seeds), 2/3 Journal images dead, DiscoverFeed stuck as skeletons.
- Phased adoption plan keeping Atlas identity: (0) real photography; (1) promo marquee + sticky category tiles + mini-PDP card upgrades; (2) hero carousel + mid-page campaign banners; (3) shop-by-occasion grid + department zones (wedding corner, jewelry).
- OpenSouk is the differentiator Homzmart cannot copy — keep it the only indigo full-bleed band and make it MORE distinct (trading-floor PostCards with live offer counts, amber budget chips, optional request ticker).
- Implementation note (same day): user confirmed preference for simplicity and disliked the amber canvas; best-practice research (Baymard, PathEdits, BrainSpate) backed white/near-white canvas with brand color as accent; neutral-canvas sweep shipped across commits afbe532, 9f437d5, 9e97523 (60-30-10 rule, gray hairlines, amber accent-only).

## See also
- [[entities/homzmart]]
- [[concepts/home-merchandising-roadmap]]
- [[concepts/atlas-design-system]]
- [[concepts/hero-admin-switch]]
- [[concepts/open-souk-feature]]
