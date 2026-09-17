---
name: specs/004-frontend-improvements/spec.md
description: Auto-synced from specs/004-frontend-improvements/spec.md
type: source
sync_origin: specs/004-frontend-improvements/spec.md
sync_hash: f1fc618b0990cc26
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/004-frontend-improvements/spec.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Feature Specification: Frontend Quality Improvements

**Feature Branch**: `004-frontend-improvements`
**Created**: 2026-05-14
**Status**: Draft
**Input**: User description: "Run full audit then create spec for frontend improvements"

## User Scenarios & Testing

### User Story 1 — Security headers are applied to all routes (Priority: P0)

The app currently loses all security headers because `next.config.js` defines `async headers()` twice — the second definition at line 136 completely overrides the first at line 63. Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) are not applied to any route.

**Why this priority**: Every request is missing security headers. This is a live vulnerability affecting all users.

**Independent Test**: Run `curl -I http://localhost:3000` and verify response includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** a request is made to any page, **Then** security headers are present in the response.
2. **Given** the fix is applied, **When** `npm run build:dev` completes, **Then** the build succeeds without errors.

---

### User Story 2 — HeroSlider CTA matches Beldify design system (Priority: P0)

HeroSlider uses `from-indigo-600 to-purple-600` gradient buttons that explicitly violate DESIGN.md §8 anti-pattern: "Generic SaaS purple→blue gradient buttons" and §2 "Do NOT use purple gradients on white."

**Why this priority**: HeroSlider is the highest-visibility component on the site. The gradient CTA undermines the brand's editorial Moroccan identity.

**Independent Test**: Inspect HeroSlider CTA button — it must use solid `bg-indigo-600` with `hover:bg-indigo-700` per DESIGN.md §6.1, not any gradient.

**Acceptance Scenarios**:

1. **Given** a user views the hero slider, **When** the CTA button renders, **Then** it uses solid indigo background (no purple gradient).
2. **Given** a user hovers over the CTA, **Then** the button darkens to indigo-700 (no scale transform).

---

### User Story 3 — Users can zoom text on mobile (Priority: P1)

`layout.tsx:96` sets `userScalable: false` in the viewport config, preventing users from zooming text. This violates WCAG 1.4.4 Resize Text (Level AA).

**Why this priority**: Direct accessibility violation. Visually impaired users and Arabic readers who need larger text cannot zoom.

**Independent Test**: On a mobile device, pinch-zoom any page. Text must scale. Verify viewport meta in page source does not contain `user-scalable=no`.

**Acceptance Scenarios**:

1. **Given** a visually impaired user visits the site on mobile, **When** they pinch-zoom the page, **Then** text scales up.
2. **Given** the fix is applied, **When** the page source is inspected, **Then** the viewport meta tag allows user scaling.

---

### User Story 4 — Language code is semantically correct (Priority: P1)

`layout.tsx:103` sets `lang="ma"` which is not a valid BCP 47 language tag. `ma` is Morocco's ISO 3166 country code, not a language code. Screen readers cannot identify the page language.

**Why this priority**: WCAG 3.1.1 Language of Page (Level A) violation. Screen readers mispronounce all content.

**Independent Test**: Inspect `<html>` element — lang must be `ar` (not `ma`). Verify with WAVE or axe accessibility tools passes.

**Acceptance Scenarios**:

1. **Given** an Arabic-speaking screen reader user visits the site, **When** the page loads, **Then** the screen reader identifies Arabic as the page language and uses correct Arabic pronunciation.
2. **Given** the fix is applied, **When** running axe-core audit, **Then** no "language of page" violations appear.

---

### User Story 5 — Headings render in Playfair Display (Priority: P1)

`globals.css:85` sets `--font-heading` to Montserrat, but DESIGN.md §3 mandates Playfair Display for all headings. Every `h1-h6` across the app renders in Montserrat instead of the brand's editorial serif.

**Why this priority**: Brand identity. The editorial serif heading is a core differentiator of the Beldify design language. Every page is affected.

**Independent Test**: Inspect any heading element on the homepage — computed font-family must include "Playfair Display". Run `npm run build:dev` to verify no broken font references.

**Acceptance Scenarios**:

1. **Given** a user views any page with headings, **When** the page renders, **Then** all h1-h6 elements use Playfair Display serif font.
2. **Given** Montserrat is removed from layout.tsx, **When** the app builds, **Then** no build errors related to missing font variables occur.

---

### User Story 6 — FeaturedSections CTAs match design system (Priority: P1)

FeaturedSections hard-codes two gradient CTAs: `from-indigo-600 to-purple-600` and `from-pink-600 to-red-600` — neither matches the Beldify palette.

**Why this priority**: Direct DESIGN.md violation on a high-traffic homepage section.

**Independent Test**: Inspect special offer cards on homepage — backgrounds must be solid indigo or amber, not gradients. Pink-to-red is not in the palette.

**Acceptance Scenarios**:

1. **Given** the special offers section renders on the homepage, **When** the offer cards appear, **Then** they use solid colors from the Beldify palette (indigo or amber).
2. **Given** the fix is applied, **When** a search for `to-purple-600` runs across src/, **Then** zero results return.

---

### User Story 7 — Bundle size reduced via icon library consolidation (Priority: P2)

Three icon libraries are shipped: `@heroicons/react` (80 files), `lucide-react` (16 files), `react-icons` (9 files). This inflates the bundle unnecessarily.

**Why this priority**: Bundle bloat affects page load speed. Consolidating reduces JS shipped to every user.

**Independent Test**: Run `npm run build:prod`, check bundle analyzer output. Only one icon library should appear. Run `npm run test` to verify no broken icon references.

**Acceptance Scenarios**:

1. **Given** the consolidation is complete, **When** a grep for `from 'lucide-react'` and `from 'react-icons'` runs across src/, **Then** zero results return.
2. **Given** the fix is applied, **When** the app is visually inspected, **Then** all icons render correctly with no visual regressions.

---

### User Story 8 — Design system token alignment (Priority: P2)

Minor theming inconsistencies: mobile bottom nav uses `border-gray-200` instead of amber, HeroSlider fallback image uses hard-coded purple gradient, FeaturedSections uses blue badges outside the palette, and `theme/typography.ts` references fonts not in DESIGN.md.

**Why this priority**: Inconsistencies accumulate and erode brand perception over time.

**Independent Test**: Visual inspection of bottom nav border (should be amber-200/60), HeroSlider error fallback (should be indigo), tailor badges (should be indigo or amber).

**Acceptance Scenarios**:

1. **Given** the mobile bottom nav renders, **When** inspected, **Then** the top border uses amber-200/60, not gray-200.
2. **Given** a HeroSlider image fails to load, **When** the fallback renders, **Then** it uses indigo-800/950 gradient, not purple.
3. **Given** tailor badges render in FeaturedSections, **When** inspected, **Then** they use indigo or amber colors from the Beldify palette.

---

### Edge Cases

- What happens when the Playfair Display font fails to load? — System font fallback (`ui-serif, Georgia, serif`) must render.
- What happens when consolidating icons — any icon mismatches between heroicons and lucide-react? — Replace with closest heroicons equivalent; visually verify.
- What happens when `secondary-50` Tailwind class is used but shade 50 isn't defined as a key in the config object? — Verify Tailwind resolves `secondary-50` from the numeric scale or define it explicitly.
- What happens when the `lang` attribute changes from `ma` to `ar` — any i18n logic that checks for `ma`? — Search for `language === 'ma'` and update to `ar` where appropriate.

## Requirements

### Functional Requirements

- **FR-001**: System MUST apply all security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) to every route via a single merged `async headers()` function in `next.config.js`.
- **FR-002**: System MUST use solid `bg-indigo-600` for HeroSlider CTA button per DESIGN.md §6.1.
- **FR-003**: System MUST allow user-initiated zoom (remove `userScalable: false` from viewport config).
- **FR-004**: System MUST declare `lang="ar"` on the `<html>` element with `dir="rtl"` for Arabic-first pages.
- **FR-005**: System MUST use Playfair Display as the heading font (`--font-heading`) per DESIGN.md §3.
- **FR-006**: System MUST remove Montserrat font import from `layout.tsx` unless needed elsewhere in DESIGN.md.
- **FR-007**: System MUST replace FeaturedSections gradient CTAs with solid Beldify palette colors.
- **FR-008**: System MUST consolidate icon imports to a single library (`@heroicons/react`) across all components.
- **FR-009**: System MUST remove unused/dead code: duplicate `BottomNavigation.tsx` component.
- **FR-010**: System MUST use amber-200/60 for bottom nav top border instead of gray-200.
- **FR-011**: System MUST use indigo gradient (not purple) for HeroSlider image load failure fallback.
- **FR-012**: System MUST update `theme/typography.ts` to match DESIGN.md font configuration (Poppins/Rubik/Playfair) or remove if unused.
- **FR-013**: System MUST replace blue badges in FeaturedSections tailors section with indigo or amber equivalents.

### Key Entities

N/A — this is a frontend quality/polish improvement, no new data entities.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 6 security headers appear in HTTP response for any page route (verified via `curl -I`).
- **SC-002**: Zero occurrences of `from-indigo-600 to-purple-600` or `from-pink-600 to-red-600` in the codebase after fixes.
- **SC-003**: Lighthouse Accessibility score does not decrease (baseline to be captured before changes).
- **SC-004**: `npm run build:prod` completes successfully with no new errors.
- **SC-005**: `npm run lint` passes with zero errors (no regressions).
- **SC-006**: Audit re-score improves from 13/20 to at least 17/20 (Good) on the 5-dimension scale.
- **SC-007**: Only one icon library (`@heroicons/react`) remains in the dependency tree for icon components.

