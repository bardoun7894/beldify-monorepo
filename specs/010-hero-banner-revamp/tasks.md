# Tasks: 010 — Hero Revamp (Search + Split-Canvas) & AI-Banner Activation

**Branch (both repos)**: `feat/hero-banner-revamp`
**Frontend worktree**: `/Users/mohamedbardouni/projects/beldify-hero/beldify-frontend`
**Backend worktree**: `/Users/mohamedbardouni/projects/beldify-backend-hero`
**Hard rule**: work ONLY in these worktrees. The live tree (`/Users/mohamedbardouni/projects/beldify`, `feat/seller-payouts`) is a CONCURRENT session — do not touch it.

Independent units (NIU = 4): T1+T2 (frontend, sequential within FE), T3 (backend, parallel), T4 (QA, after FE), T5 (review, last). T1/T2 and T3 run in parallel.

---

## T1 — [x] [frontend-engineer] Unified hero composition + SplitCanvasSlide  (P0, core)
**Files**: `beldify-frontend/src/components/home/HeroSection.tsx`, new `SplitCanvasSlide.tsx`, new `heroCompose.ts` (helper), `CampaignArtSlides.tsx` (port art into split-canvas), `ProductHeroSlides.tsx` (fold in / delete), `BrandHeroSlide.tsx` (DELETE).
**Do**:
- Build `heroCompose(hero, products) => HeroSlideData[]` per plan.md (banners→products→art, cap ≤6, always ≥1). Pure + unit-testable.
- Build `SplitCanvasSlide` (50/50 image|text-on-`bg-canvas`; image side from `imageSide` via logical flex; mobile vertical stack; Atlas tokens only — `hsl(var(--primary|--secondary))`, `font-heading`; amber only on CTA).
- Refactor `HeroSection` to render `<HeroSearchBar/>` + one Swiper of `SplitCanvasSlide`s from the composed array. Remove the 3-way if/else.
- Remove inline `<style>` + `realIndex===2` `classList` hack → pagination dots styled in `globals.css` with tokens. Delete `BrandHeroSlide.tsx` + import. Fold product path in; drop `Playfair Display` inline font (→ `font-heading`).
- Preserve a11y (Swiper A11y labels i18n), keyboard, `prefers-reduced-motion` autoplay-off, alt text, focus rings.
**TDD**: write `hero-compose` + `split-canvas-slide` tests first (red→green). Run via `npm run test` (NEVER bare vitest).
**Done when**: no raw `indigo-*`/`amber-*`/hex in new hero code; lint clean.

## T2 — [x] [frontend-engineer] HeroSearchBar + i18n  (P0, core; after/with T1)
**Files**: new `HeroSearchBar.tsx`, all 7 locale JSONs under `beldify-frontend/src/i18n/locales/*` (or wherever keys live).
**Do**:
- Persistent search bar: lucide search icon, i18n placeholder `home.hero.search_placeholder`, submit → in-app products/search route `?q=`. RTL-aware, amber focus ring, ≥44px touch target. Never off-platform.
- Add ALL new i18n keys (search placeholder, any new eyebrow/cta strings) to all 7 locales (en, ar, fr, es, ma, nl, de) — exact parity or i18n-lint/tests fail (`[[beldify-i18n-architecture]]`).
**TDD**: `hero-search` test (submit builds correct in-app href, placeholder i18n, a11y label). `npm run test`.

## T3 — [x] [backend-engineer] Verify contract + activation doc (+ optional S1/S2)  (P1)
**Worktree**: `/Users/mohamedbardouni/projects/beldify-backend-hero`
**Do (required)**:
- Verify `/api/hero-config` (`App/Http/Controllers/API/HeroConfigController.php`) still returns `text_position` and the documented shape — frontend depends on it unchanged. Run the existing `HeroConfigApiTest` to confirm green. Report the exact JSON shape back.
- Confirm the AI banner generator is present on this branch (`BannerAiController`, `_ai_generate.blade.php`, `admin.banners.ai.*` routes) and note the exact `AiSetting` key (`ai.kie.api_key`) + model key for the activation doc.
- Write `docs/guides/ai-banner-activation.md` (FR7): step-by-step to activate (paste Kie.ai key in Admin → AI Settings → model field → generate at Admin → Banners → Add New → review copy/image → Save → appears in campaign carousel). Note it requires hero mode = `campaign`.
**Optional (only if required part is fast & green)**:
- S2: clarify in `resources/views/admin/banners/create.blade.php` + `edit.blade.php` that `text_position` controls the "image side".
- S1: SKIP unless explicitly confirmed — banner copy auto-translate is gated on content-policy reconciliation (content rule = `ar` for ar/ma else `en`). Do NOT add columns/translation without a go-ahead.
**Do NOT**: touch frontend; touch the live tree.

## T4 — [x] [qa-engineer] Hero test suite update + green gate  (after T1/T2)
**Worktree**: `/Users/mohamedbardouni/projects/beldify-hero/beldify-frontend`
**Do**:
- Update `hero-admin-switch.test.ts` (drop BrandHeroSlide assertion; assert new Swiper-of-SplitCanvasSlide structure, autoplay/a11y/reduced-motion preserved), `campaign-art-hero.test.ts` (art now rendered as split-canvas, 60-30-10 — no full-amber bg), `product-hero-slides.test.tsx` (product path folded in).
- Add token-compliance assertions (no `amber-500`/`indigo-950` literal full-bg; CTA is the only amber). i18n parity for the 7 locales.
- Run the FULL frontend suite via `npm run test` and report pass/fail counts. Verify `npm run lint` + `npm run build:prod`.
**Do NOT**: modify production code (escalate failures to frontend-engineer).

## T5 — [reviewer] Spec compliance + API contract  (last)
**Do**:
- Review the diff (both worktrees) against spec.md FR1–FR7. Confirm: tokens-only, 60-30-10 respected, dead code/hacks removed, RTL flex logic correct, search is in-app only, a11y preserved.
- Confirm `/api/hero-config` contract unchanged and the frontend mapping (`text_position`→`imageSide`) matches (the SessionStart reviewer mandate: API contracts match between Laravel routes and Next.js fetch).
- Report findings P0–P3; do not edit.
