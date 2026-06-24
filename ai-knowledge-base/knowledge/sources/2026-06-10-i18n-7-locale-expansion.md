---
name: i18n expansion to 7 locales + content-locale rule (2026-06-10)
description: Dutch + German added with exact 3628-key parity across 7 locales via a Haiku-agent translation pipeline; backend content-locale rule (ar content for ar+ma, en otherwise) via LanguageService::contentLocale + ApiLocaleMiddleware
type: source
sources: [raw/2026-06-10-i18n-7-locale-expansion.md]
created: 2026-06-10
updated: 2026-06-10
---

# i18n expansion to 7 locales + content-locale rule (2026-06-10)

## Summary
The storefront grew from 5 to 7 locales (nl Dutch informal je/jouw, de German informal du in the Zalando register), translated from English by 30+ Haiku translator agents and brought to exact parity — a 3628-leaf-key union with 0 missing keys in all 7 locales. A backend content-locale rule was introduced for the bilingual catalog, and the frontend now actually sends its language to the API.

## Key points
- **Parity + collisions**: previous state was en 3576 / ar 3640 / fr+ma 3515 / es 3488 of a 3664-key union with leaf/branch collisions. Collisions normalized to code-canonical shapes: `orders.payment_status.*` and `community.category.*` are branches (dynamic `t()`), `footer.newsletter/shop/returns` are leaves; ~85 dead branch keys dropped; ar's `footer.returns` branch was a live bug (Arabic footer rendered the raw key). fr/es `orders.items.color/size` contained literal `{{color}}`/`{{size}}` placeholders rendered as labels.
- **Language suggestion banner**: `LanguageSuggestionBanner.tsx` + pure `suggestLocale()` driven by `navigator.languages` primary subtag (ar-MA → ma); shown once, only when no NEXT_LOCALE cookie exists and suggestion ≠ current; never auto-switches — the deliberate Darija default and narrow detection order stay untouched. `fallbackLng` converted to object form: nl/de/fr/es → en, default → ma/ar/fr/en.
- **LanguageSwitcher flags**: `/images/flags/*.svg` never existed (404 broken images since forever) — replaced with Atlas typographic chips, 7 languages.
- **Content-locale rule (backend)**: catalog content is bilingual (`stocks.product_name_ar/en`); rule = ar content for ui locales ar+ma, en content for en/fr/es/nl/de. New `LanguageService::contentLocale()` + `ApiLocaleMiddleware` on the api group (`?locale=` → `X-Locale` → `Accept-Language` primary subtag; 7-locale whitelist; never throws). All binary `$locale === 'ar'` picks converted across ProductController (~20 sites), SellerReportController, MegaOfferController, SellerProductController, Mobile/AuthController, WishlistResource (was hardcoded `_en`). Category 5-column fields: unknown locales fall back to en NOT ar; empty values fall back ar↔en by script. 18 new tests (`ProductLocaleContentTest`).
- **Frontend sends language**: axios interceptor sets Accept-Language from i18next; products page + DiscoverFeed pass `?locale=` — DiscoverFeed previously HARDCODED `locale=ma` and the products page sent nothing, so Darija/Arabic users got English product names.
- **Backlog closures**: `products.sort.newest/price_low/price_high/popular` keys properly named ×7 locales; 6 remaining bare strings in HomeContent.tsx routed through `t()`; 9 missing `home.*` keys authored ×7 (3 `*Ar` keys intentionally Arabic in every locale — decorative bilingual design).
- **Pipeline (reusable)**: pre-split en.json into ≤340-key namespace chunks, 1 Haiku agent per chunk per language, centralized python merge + structural validation (key parity, placeholder-set equality, emptied-value check, untranslated-ratio heuristic). Agents' self-reported counts are unreliable; structural validation caught everything that mattered. An "identical to en" scan + per-language reviewer pass separated cognates/proper nouns from 19 genuine misses (fr 2, nl 17). Locale-file writes centralized in the orchestrator to avoid shared-tree races.
- **Gate**: vitest 2036/2036, tsc 0, ESLint 0, build:prod clean; backend ProductLocaleContentTest 16 passed + 2 deprecated.
- **Open/deferred**: backend Blade `lang/` parity heavily diverged (es/fr/ma missing 300+ keys, report-only); backend has no nl/de by design (admin/seller Blade is ar/en only); CF-IPCountry-based suggestion deferred.

## See also
- [[concepts/i18n-7-locale-expansion]]
- [[concepts/i18n-t-fallback-vs-locale-value]]
- [[concepts/storefront-home-marketplace-overhaul]]
- [[entities/nextjs]]
- [[entities/laravel]]
