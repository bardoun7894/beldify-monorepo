---
source: gemini
model: gemini-2.5-pro (cli 0.40.1)
date: 2026-06-13
target: beldify-frontend/src/components/home/{HeroSection,CampaignArtSlides,ProductHeroSlides}.tsx + tailwind.config.js (Atlas tokens)
scope: design-review + plan
---

## Prior art consulted
- /kb-query: hero admin switch (brand|campaign, /api/hero-config), Atlas tokens (Indigo+Amber 60-30-10), i18n 7-locale (banner copy only _en/_ar = gap), AI banner generator (Kie.ai, unmerged, slots into campaign Swiper). [[beldify-hero-admin-switch]] [[beldify-design-tokens]] [[beldify-tailwind-atlas-token-collision]] [[beldify-i18n-architecture]] [[beldify-ai-banner-generation]] [[beldify-whatsapp-never-checkout]]
- NotebookLM: n/a (not queried this run)

## Gemini output (verbatim, trimmed)

### CRITIQUE
- CampaignArtSlides.tsx:165 — **P0** 60-30-10 violation: slide 3 uses `from-amber-500 to-amber-600` full background; amber is the 10% accent, not the 60% base. Fix: neutral `bg-canvas` base, amber restricted to CTA.
- CampaignArtSlides.tsx:57 — **P1** semantic-token bypass: hardcoded `from-indigo-950`/`text-amber-400` instead of Atlas semantic classes.
- ProductHeroSlides.tsx:139 — **P1** hardcoded `fontFamily: "Playfair Display"` inline style bypasses the design system. Fix: `font-heading` token.
- HeroSection.tsx:112 — **P2** brittle inline Swiper `<style>` with raw `rgba(30,27,75)`/`rgb(245 158 11)`. Fix: global CSS + `@apply`.
- HeroSection.tsx:100 — **P0** architectural smell: isolated if/else returns mean campaign OR products OR art never mix → hurts discovery. Fix: unify all sources into one compositional array.
- HeroSection.tsx:129 — **P2** brittle `realIdx === 2` DOM manipulation for amber-slide dot inversion.
- HeroSection.tsx:28 — **P1** physical-vs-logical RTL collision: DB `left`/`right` mapped to logical start/end can push Arabic text over the image subject. Fix: avoid text-over-full-bleed; use split layout.
- BrandHeroSlide.tsx:1 — **P2** dead shim; delete.

### DIRECTIONS
1. **Split-Canvas Unified Carousel (Gemini's pick)** — every slide is a 50/50 image|text-on-canvas split; one component for product/AI-banner/art; text uncoupled from image (mitigates 7-locale gap + RTL overlay); flattened `HeroSlideData[]`. Tradeoff: taller on mobile (vertical stack).
2. **Editorial Bento Grid** — big tile + 2 small, all visible, staggered fade-in, no carousel blindness. Tradeoff: breaks with sparse content.
3. **Feature Track over Search Header** — Atlas header with H1 + global search, then horizontal App-Store-style card track. Tradeoff: deprioritizes emotional editorial photography.

### RANKED RECOMMENDATION: #1 Split-Canvas
Resolves 60-30-10 (anchor in bg-canvas), RTL overlay (text off image), AI-banner injection, one scalable component API. Implied changes: delete BrandHeroSlide; flatten sources into one array in HeroSection; new `<SplitCanvasSlide>`; move inline Swiper CSS to global `@apply`; drop `realIdx===2` hack. Backend: deprecate/repurpose `text_position`.

## Claude synthesis
- **Load-bearing & agreed:** the 60-30-10 amber P0, the 3-way-fallback P0, token drift, dead shim, brittle dot hack — all match my independent read. Action all of them.
- **Gap gemini under-weighted: SEARCH.** For an Arabic-first marketplace, a persistent search/discovery bar is the highest-intent hero element and it was dropped when the editorial hero became art slides. Direction 3's search-header instinct is right; gemini's Direction 1 (Split-Canvas) is the right *carousel*. → Recommend a **hybrid: persistent search header + Split-Canvas unified carousel below.**
- **text_position:** don't deprecate — **repurpose** to "image side" (flex-row / flex-row-reverse), so the admin field stays meaningful and RTL-safe.
- **7-locale copy gap:** split-canvas only hides the visual break; the data fix is to **auto-translate banner copy on save** to fr/es/ma/nl/de, reusing the exact category auto-translate pattern ([[beldify-category-autotranslate]]) rather than English fallback.
- **AI banners:** unified array means AI-generated banners slot in as first-class `HeroSlideData`, not buried behind 3 fixed art slides (current behavior).
