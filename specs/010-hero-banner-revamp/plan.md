# Plan: 010 — Hero Revamp (Search + Split-Canvas)

## Architecture (frontend)

Replace the 3-way branch with: **search bar + ONE unified carousel of `SplitCanvasSlide`s** driven by a single composed array.

```
HeroSection (client)
├── <HeroSearchBar />                  ← FR1, persistent, in-app submit
└── <Swiper className="hero-swiper">   ← FR2, single carousel
      {slides.map(s => <SplitCanvasSlide key={s.id} slide={s} priority={i===0} />)}
```

### Data model — unify all sources (FR2)

```ts
type HeroSlideKind = 'banner' | 'product' | 'art';
interface HeroSlideData {
  id: string;
  kind: HeroSlideKind;
  imageUrl?: string;          // banner.image_url | product image | undefined (art)
  imageSide: 'start' | 'end'; // banner.text_position: 'right'->'end' else 'start'; flips in RTL
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref: string;            // always in-app
  artVariant?: 1 | 2 | 3;     // when kind==='art'
}
```

Composition (pure helper, unit-testable):
1. If `mode==='campaign'`: map `hero.banners` → `kind:'banner'`.
2. Map up to ~2 `products` → `kind:'product'` (reuse the HomeContent pre-filter: real images, cap).
3. Append built-in art slides (Free-delivery, Tailoring, Open Souk) → `kind:'art'` to guarantee a non-sparse, always-≥1 carousel.
4. Order banners → product(s) → art; cap total ≤ 6; dedupe.

### `SplitCanvasSlide` (FR3, FR4)

- Container: `flex flex-col lg:flex-row` (+ `lg:flex-row-reverse` when `imageSide==='end'`) — logical, RTL-correct. Mobile = image top, text bottom.
- Image half: `next/image fill` (banner/product) OR the ported decorative gradient/SVG art (for `kind:'art'`), amber used ONLY as small accent.
- Text half: `bg-canvas` (Atlas neutral), eyebrow chip, `font-heading` headline, subtitle, **amber CTA** (`hsl(var(--primary))`), indigo text (`hsl(var(--secondary))`). 60-30-10 honored.
- Tokens only — no raw `indigo-*`/`amber-*`/hex. Reference `[[beldify-tailwind-atlas-token-collision]]`.

### `HeroSearchBar` (FR1)

- Full-width input, search icon (lucide), i18n placeholder `home.hero.search_placeholder`, submit → existing products/search route with `?q=`. RTL-aware, amber focus ring, ≥44px.
- Optional quick-category chips below (stretch, only if cheap).

### Cleanup (FR5)

- Delete `BrandHeroSlide.tsx`; remove its import in `HeroSection`; update `hero-admin-switch.test.ts` assertion that requires it.
- Remove inline `<style>` block + `onSlideChange`/`realIndex===2` `classList` hack. Move pagination-dot styling to `globals.css` using Atlas tokens; no full-amber slide so no inversion needed.
- Fold `ProductHeroSlides` into `SplitCanvasSlide` (`kind:'product'`); drop `Playfair Display` inline font (use `font-heading`). Delete `ProductHeroSlides.tsx` if fully absorbed (and update its test).

## Backend (small / optional)

- **No mandatory change.** `/api/hero-config` already returns `text_position`; frontend maps it. Verify contract unchanged (reviewer).
- S2 (optional): admin label tweak in `create.blade.php`/`edit.blade.php` clarifying `text_position` = "image side".
- S1 (optional, gated): banner copy auto-translate via `CategoryTranslationService` pattern — only after content-policy reconciliation.

## Docs (FR7)

- `docs/guides/ai-banner-activation.md`: steps to activate AI generator (Kie.ai key in Admin → AI Settings → model field → generate at Admin → Banners → Add New). Cross-link backend `docs/admin-banner-ai.md`.

## Testing (TDD)

- Frontend, `beldify-frontend`, **`npm run test`** only (`[[beldify-vitest-dual-config-hazard]]`).
- New: `split-canvas-slide` test (image-side flip, token classes, kinds), `hero-search` test (submit, i18n, a11y), `hero-compose` unit test (array composition from mode/banners/products).
- Update: `hero-admin-switch.test.ts`, `campaign-art-hero.test.ts`, `product-hero-slides.test.tsx` for the new structure.
- All 7 locale keys present for new strings (en, ar, fr, es, ma, nl, de) — i18n parity.

## Risks / guards

- **Isolation**: frontend work in `/Users/mohamedbardouni/projects/beldify-hero` only; backend in `/Users/mohamedbardouni/projects/beldify-backend-hero` only. Never the live tree.
- **Token inversion**: `primary`=amber, `secondary`=indigo — verify against `tailwind.config.js`; prefer `hsl(var(--primary|--secondary))` arbitrary form.
- **i18n keys**: add to all 7 locale files or i18n-lint/tests fail.
- Verify `npm run lint` + `npm run build:prod` before claiming done.
