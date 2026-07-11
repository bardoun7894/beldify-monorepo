# Beldify Frontend Audit — 2026-07-10

**Method:** Static structural audit via `lsp_diagnostics` + `ast_grep_search` + targeted `read`. No browser dogfood (agent-browser not installed).

**Scope:** `beldify-frontend/src/components/**` (111 files across 13 subdirs) and `beldify-frontend/src/app/**` (50+ routes).

**Status:** P0 + P1 fixes applied. See "Fixes Applied" section below.

---

## Coverage Matrix

| Directory            | Files | Errors | Warnings | Hints | Status |
|----------------------|-------|--------|----------|-------|--------|
| `src/app/**`         | 50+   | 0      | 0        | 0     | ✅ clean |
| `src/components/assistant/` | 1 | 0 | 0 | 0 | ✅ FIXED |
| `src/components/auth/`     | 1 | 0 | 0 | 0 | ✅ clean |
| `src/components/cart/`     | 5 | 0 | 0 | 0 | ✅ clean |
| `src/components/category/` | 1 | 0 | 0 | 0 | ✅ clean |
| `src/components/checkout/` | 5 | 0 | 0 | 1 | ⚠️ FormEvent deprecation |
| `src/components/home/`     | 17 | 5* | 1 | 5 | ⚠️ false-positive FP + 4 P2/P3 |
| `src/components/layout/`   | 6 | 0 | 0 | 0 | ✅ clean |
| `src/components/orders/`   | 3 | 0 | 0 | 0 | ✅ clean |
| `src/components/products/` | 19 | 0 | 0 | 1 | ⚠️ unused import |
| `src/components/reviews/`  | 4 | 0 | 0 | 4 | ⚠️ 2 unused + 2 deprecation |
| `src/components/search/`   | 3 | 0 | 0 | 1 | ⚠️ unused const |
| `src/components/skeletons/`| 1 | 0 | 0 | 0 | ✅ clean |
| `src/components/ui/`       | 20 | 0 | 0 | 10 | ⚠️ 7 ElementRef deprecations |

\* 5 errors are ast-grep `no-nested-links` false positives (see Issue-006).

---

## Fixes Applied (this session)

### ✅ P0 #001 — `t is not defined` in `FeaturedProducts` — FIXED

- **File:** `src/components/home/FeaturedProducts.tsx`
- **Change:** Added `const { t } = useTranslation();` inside the `FeaturedProducts` component (one-line add, just after the function signature on line 29).
- **Verified:** `lsp_diagnostics` clean (only pre-existing `inline-styles` hint at L45).

### ✅ P0 #002 — Non-serializable function prop in `CategoryCard` — FIXED

- **Files:** `src/components/home/CategoryCard.tsx` + `src/components/home/HomeContent.tsx`
- **Changes (CategoryCard):**
  - Removed `imgFailed` and `onImageError` from `CategoryCardProps` type.
  - Added `useState<boolean>(false)` for local image-failure tracking.
  - Removed `onImageError?.(id)` from `<Image>` `onError` handler — replaced with local `setImgFailed(true)`.
- **Changes (HomeContent):**
  - Removed `catImageError` state declaration (no longer needed).
  - Removed `imgFailed` and `onImageError` props from the `<CategoryCard>` call site.
- **Verified:** `lsp_diagnostics` clean on both files. The card is now self-contained; the parent no longer passes a function across the RSC boundary.

### ✅ P1 #003 — `TFunction` type mismatch in `AssistantPanel` — FIXED

- **File:** `src/components/assistant/AssistantPanel.tsx`
- **Change:** Updated local `AssistantProductCard` prop type from `t: (k: string, fb?: string) => string` to `t: ReturnType<typeof useTranslation>['t']` (matches i18next's actual `TFunction` shape).
- **Verified:** `lsp_diagnostics` on `src/components/assistant/` returns 0 errors. (File-level scan showed stale cache, but directory-level scan confirms the fix.)

---

## Remaining Issues (not yet fixed)

### ⚠️ P2 — Deprecation Warnings (non-blocking, cleanup)

#### ISSUE-004: `ElementRef` deprecated in `select.tsx`

- **File:** `src/components/ui/select.tsx:14, 34, 48, 62, 94, 106, 129` (7 occurrences)
- **Symptom:** `@types/react` 18.3+ deprecated `ElementRef` in favour of `React.ComponentRef`.
- **Fix:** Global replace `ElementRef<` → `ComponentRef<`. Will become a hard requirement for React 19 migration.
- **Severity:** P2

#### ISSUE-005: `FormEvent` deprecated

- **Files:** `src/components/checkout/CustomOrderForm.tsx:85`, `src/components/reviews/ReviewForm.tsx:1, 85`
- **Fix:** Use `React.FormEvent` directly (no destructured import) or switch to `ChangeEvent` where applicable.
- **Severity:** P2

---

### ⚠️ Issue-006: False-positive `no-nested-links` warnings in HomeContent

- **File:** `src/components/home/HomeContent.tsx:242, 834, 851, 852, 864`
- **Status:** **Investigated, confirmed false positive.** Visual inspection of the entire seller CTA section (L834-920) and chip rail (L240-300) shows:
  - The seller CTA has exactly one native `<a>` at L862-867, with only text and `<ArrowRight>` inside — no actual nesting.
  - The chip rail "All categories" `<Link>` at L287 contains only `<span>` and `<ArrowRight>` — no actual nesting.
- **Likely rule behavior:** The ast-grep `no-nested-links` rule walks up the container chain and reports each level, producing 5 "errors" for a single (non-existent) issue. The columns 5, 7, 9, 11, 13 line up exactly with the indent levels (root div → section → div → div → div → `<a>`).
- **Action:** No code change required. Rule is a false positive in this context. Consider suppressing the rule for this file or refining its matcher.
- **Severity:** informational only

---

### 🟢 P3 — Unused Declarations (cleanup, no runtime impact)

| File | Line | Issue |
|------|------|-------|
| `src/components/products/NotifyMeButton.tsx` | 25 | `BellOff` imported, never used |
| `src/components/home/FeaturedProducts.tsx` | 4 | `useTranslation` imported — was unused (FIXED via #001) |
| `src/components/home/DiscoverFeed.tsx` | 64 | `t` destructured but never used |
| `src/components/home/Hero.tsx` | 7, 31, 74 | `featuredBrands`, `featuredCategories`, `isRTL` unused |
| `src/components/home/HeroSection.tsx` | 3, 9, 10 | `useRef`, `CampaignArtSlides`, `BrandHeroSlide` unused |
| `src/components/reviews/ReviewCard.tsx` | 46, 47 | `prevLikes`, `prevDislikes` unused |
| `src/components/search/SearchSuggestions.tsx` | 56 | `COLLAPSED_STORE_LIMIT` unused |
| `src/components/ui/loading.tsx` | 17, 51 | `i18n` destructured but never used |
| `src/components/ui/StockStatus.tsx` | 28 | `isInStock` destructured but never used |

**Severity:** P3 — TypeScript hints only, no runtime impact. Safe to leave but worth a cleanup pass.

---

## ✅ Pages That Passed (no errors, no warnings, no hints)

All 50+ App Router pages scanned: `/`, `/about`, `/cart`, `/categories`, `/checkout`, `/community`, `/compare`, `/contact`, `/custom-orders`, `/faqs`, `/forgot-password`, `/login`, `/mega-offers`, `/messages`, `/notifications`, `/offline`, `/order-confirmation`, `/orders`, `/privacy-policy`, `/products`, `/profile`, `/register`, `/reset-password`, `/returns`, `/search`, `/seller/*`, `/sellers`, `/services`, `/shipping`, `/shops`, `/size-guide`, `/terms-of-service`, `/track`, `/verify-email`, `/not-found`, `/error`, `/global-error`.

---

## Recommended Next Steps

1. **Verify build** — Run `npm run build:dev` from `beldify-frontend/` to confirm the P0/P1 fixes compile cleanly end-to-end. (Currently blocked by workflow-enforcement gate; would need a `delegate` to a sub-agent that can run bash.)
2. **Browser dogfood** — Install `agent-browser` (`npm i -g agent-browser`) to do live UI checks against the production build, including RTL rendering, image fallback, and console errors.
3. **P2 cleanup pass** — Replace `ElementRef` → `ComponentRef` (7 sites) and `FormEvent` direct imports.
4. **P3 dead-code sweep** — Remove unused imports/vars (low priority).

---

## Out of Scope (not checked)

- Backend routes / API contracts (separate audit)
- RTL/i18n key coverage (per-locale translation completeness — different audit needed)
- Visual / responsive / a11y runtime checks (need browser)
- Performance / Lighthouse (need browser)
- Build configuration (`next.config.js`, Tailwind config)
- Tests (`src/**/__tests__/`)
