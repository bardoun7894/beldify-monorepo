# Spec: 010 — Homepage Hero Revamp (Search + Split-Canvas) & AI-Banner Activation

**Status**: Ready for build
**Branch**: `feat/hero-banner-revamp` (both repos)
**Date**: 2026-06-13

## Problem

The current homepage hero (`HeroSection.tsx`) has structural and brand problems (confirmed by gemini design review + independent read):

1. **Architectural smell** — a 3-way `if/else` fallback (campaign Swiper *or* `ProductHeroSlides` *or* `CampaignArtSlides`). The three never compose; AI/admin campaign banners get buried *behind* 3 fixed art slides the admin can't control.
2. **60-30-10 violation (P0)** — art slide 3 ("Open Souk") uses a full `amber-500→amber-600` background; amber is the 10% accent, not a 60% base.
3. **Token drift (P1)** — raw `indigo-950`/`amber-500` Tailwind classes + a hardcoded `rgb(245 158 11)` inline `<style>` block + `Playfair Display` inline font in `ProductHeroSlides`, instead of Atlas semantic tokens.
4. **Brittle code (P2)** — `realIndex === 2` DOM `classList` hack to invert pagination dots; dead `BrandHeroSlide.tsx` shim still imported.
5. **RTL risk (P1)** — text overlaid on full-bleed images can collide with the image subject when alignment flips in RTL.
6. **Missing search (P1)** — the hero has no search/discovery entry point, the highest-intent element for an Arabic-first marketplace.

Separately: the AI banner generator is **already built, merged, and deployed** but **dormant** because no Kie.ai API key is configured.

## Goal

Replace the hero with a **Search + Split-Canvas** system: a persistent search bar above **one unified carousel** whose every slide is a 50/50 image-on-one-side / text-on-`bg-canvas`-other-side panel, fed by a single flattened slide array (campaign banners + products + brand art). Anchored in Atlas tokens, RTL-safe, with AI-generated banners as first-class slides. Plus: document/clarify AI-generator activation.

## Functional requirements

- **FR1** — A persistent, prominent **search bar** at the top of the hero. Submits an in-app query (to `/products?q=` or existing search route). i18n placeholder; RTL-aware; ≥44px touch target; amber focus ring. Never links off-platform.
- **FR2** — A **single unified carousel** (`HeroSection`) built from ONE `HeroSlideData[]` array composed from: campaign banners (when `mode==='campaign'`), top products (when present), and built-in brand art slides (Open Souk / Tailoring / Free-delivery). Order: banners → product(s) → art; capped (≤6 slides); always ≥1 slide (art guarantees non-empty).
- **FR3** — A new **`SplitCanvasSlide`** component: image on one side, text panel on `bg-canvas` on the other. Image side derived from the banner's `text_position` (`left`→image-start, `right`→image-end), implemented with logical flex direction so it flips correctly in RTL. Mobile: vertical stack (image top, text bottom).
- **FR4** — **Atlas token compliance**: text panel `bg-canvas`/Atlas-neutral; headings via `font-heading`; indigo via `hsl(var(--secondary))`, amber restricted to the CTA / accent via `hsl(var(--primary))`. **No** raw `indigo-*`/`amber-*` literals, no inline hex `<style>`. Honors 60-30-10.
- **FR5** — Remove dead code & hacks: delete `BrandHeroSlide.tsx` + its import + the test assertion; remove the inline `<style>` block and the `realIndex===2` `classList` hack (move pagination dot styling to global CSS using tokens; no full-amber slide → no dot inversion needed). Fold `ProductHeroSlides` product path into the unified `SplitCanvasSlide` (kind=`product`) and drop the `Playfair Display` inline font.
- **FR6** — **A11y/motion preserved or improved**: keyboard nav, Swiper A11y labels (i18n), `prefers-reduced-motion` disables autoplay, visible focus rings, alt text on images.
- **FR7** — **Activation doc**: a short doc (`docs/guides/ai-banner-activation.md` or backend `docs/admin-banner-ai.md` update) describing the exact steps to activate the AI banner generator (paste Kie.ai key in Admin → AI Settings, optional model field, then generate from Admin → Banners → Add New).

## Non-functional / constraints

- API contract `/api/hero-config` is **unchanged** for the layout (frontend reinterprets existing `text_position` as image-side). No migration required.
- Must build & lint clean (`npm run lint`, `npm run build:prod`) and pass the frontend test suite via `npm run test` (NEVER bare vitest — `[[beldify-vitest-dual-config-hazard]]`).
- All work in the dedicated worktrees only; live payouts tree untouched.

## Out of scope (explicit)

- Merging/deploying the AI banner backend (already on main + deployed).
- Entering the Kie.ai API key (user/admin action).
- Online-payment activation, payouts.

## Optional / stretch (P2 — only if core is green)

- **S1** — Banner copy auto-translation to fr/es/ma/nl/de on save, reusing `CategoryTranslationService`/`ChatClient`. **Gated**: must first reconcile with the content rule (`ar`-for-ar/ma-else-`en`) — only do this if the content policy says banners should differ from products. Backend only; additive columns or JSON.
- **S2** — Admin UI label clarifying that `text_position` now controls "image side".

## Acceptance

- Hero renders the search bar + a single Split-Canvas carousel composing banners/products/art, on desktop + mobile, LTR + RTL (ar), across all 7 locale strings.
- Zero raw `indigo-*`/`amber-*`/hex in the new hero components; tokens only. No 60-30-10 violation.
- `BrandHeroSlide.tsx` deleted; no inline `<style>`/`classList` hacks remain.
- Lint + build + `npm run test` all green; hero tests updated to the new structure.
- Activation doc present.
