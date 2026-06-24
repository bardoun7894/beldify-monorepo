# 2026-06-10 — i18n expansion to 7 locales + content-locale rule

## What shipped
- **nl (Dutch) + de (German) locales added** to the storefront: full `src/i18n/locales/nl.json` / `de.json` translated from English by 30+ Haiku translator agents (13 namespace chunks per language + straggler fills + per-language reviewer pass). Dutch = informal je/jouw; German = informal du (Zalando register). Registered in `config.ts` resources, `middleware.ts` LOCALES, LanguageSwitcher.
- **Locale completeness: exact parity** — union 3628 leaf keys, 0 missing in all 7 locales (was: en 3576, ar 3640, fr/ma 3515, es 3488 of a 3664-key union with leaf/branch collisions).
- **Leaf/branch collisions normalized to code-canonical shapes**: `orders.payment_status.*` and `community.category.*` are BRANCHES (used via dynamic `t()`); `footer.newsletter/shop/returns` are LEAVES (footer link labels). ~85 dead branch keys dropped from the union; ar's `footer.returns` branch was a live bug (Arabic footer rendered the raw key).
- **Pre-existing placeholder bugs fixed**: fr/es `orders.items.color/size` contained `{{color}}`/`{{size}}` while code renders them as labels (French users saw literal `Couleur : {{color}}`).
- **Language suggestion banner** (`LanguageSuggestionBanner.tsx` + pure `suggestLocale()` in `src/utils/suggestLocale.ts`): one-time dismissible banner driven by `navigator.languages` primary subtag (ar-MA → ma), shown only when no NEXT_LOCALE cookie exists and suggestion ≠ current. Never auto-switches — the deliberate Darija default and narrow detection order (querystring→cookie→localStorage) stay untouched. fallbackLng converted to object form: nl/de/fr/es → en, default → ma/ar/fr/en.
- **LanguageSwitcher flags fixed**: `/images/flags/*.svg` never existed (404 broken images since forever) — replaced with Atlas typographic chips (`hsl(var(--secondary) / 0.12)`), 7 languages.
- **Content-locale rule (backend)**: DB catalog content is bilingual (stocks.product_name_ar/en). Rule: **ar content for ui locales ar+ma, en content for everything else (en/fr/es/nl/de)**. New `LanguageService::contentLocale()`, new `ApiLocaleMiddleware` on the api group (?locale= → X-Locale → Accept-Language primary subtag; 7-locale whitelist; never throws). All binary `$locale === 'ar'` picks converted across ProductController (~20 sites), SellerReportController, MegaOfferController, SellerProductController, Mobile/AuthController, WishlistResource (was hardcoded _en). Category 5-column fields: unknown locales (nl/de) fall back to en NOT ar; empty values fall back ar↔en by script. 18 new tests (`ProductLocaleContentTest`).
- **Frontend now sends language**: axios interceptor sets Accept-Language from i18next; products page + DiscoverFeed pass `?locale=` (DiscoverFeed previously HARDCODED `locale=ma`; products page sent nothing → Darija/Arabic users got English product names — fixed).
- **sort.* keys properly named** (`products.sort.newest/price_low/price_high/popular`) ×7 locales — closes the post-deploy backlog item.
- **Homepage hardcoded strings**: remaining 6 bare strings in HomeContent.tsx routed through t(); 9 missing home.* keys authored ×7 locales (3 `*Ar` keys are intentionally Arabic in every locale — decorative bilingual design).

## Gate evidence
- Frontend: vitest 2036/2036, tsc 0 errors, ESLint 0 warnings, build:prod clean (incl. middleware).
- Backend: ProductLocaleContentTest 16 passed + 2 deprecated, 25 assertions (re-run by orchestrator for evidence).

## Pipeline notes (reusable)
- Translation at scale: pre-split en.json into ≤340-key namespace chunks (`.cache/i18n-work/src/`), 1 Haiku agent per chunk per language writing to `.cache/i18n-work/out-<lang>/`, centralized python merge + structural validation (key parity, placeholder-set equality per key, emptied-value check, untranslated-ratio heuristic). Agents' self-reported counts are unreliable; structural validation caught everything that mattered (1 invented `{{count}}` placeholder in de).
- "Identical to en" scan + per-language Haiku reviewer pass separates cognates/proper nouns (Casablanca, PayPal, Takchita, Total) from genuine misses (19 found: fr 2, nl 17).
- Locale-file writes were centralized in the orchestrator (agents forbidden from touching locales/*.json) to avoid shared-tree write races.

## Open / deferred
- Backend Blade lang/ parity is heavily diverged (es/fr/ma messages.php each missing 300+ keys; es/fr missing common/community/tailoring.php entirely) — report-only this session, admin Blade i18n adoption already a deferred backlog item.
- Backend lang/ has no nl/de — deliberate: admin/seller Blade is ar/en only (`config app.available_locales`), nl/de are storefront-only.
- Country-based (CF-IPCountry) suggestion deferred — browser-language signal shipped first.
- `ma` wishlist.items_count_one has no {{count}} — correct Arabic singular, validator allowlisted.

## Related
[[beldify-i18n-architecture]] [[i18n-t-fallback-vs-locale-value]] [[beldify-api-locale-middleware]]
