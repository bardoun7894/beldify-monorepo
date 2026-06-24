---
name: i18n 7-Locale Expansion & Content-Locale Rule
description: Storefront grew to 7 UI locales (ar, ma, en, fr, es, nl, de) at exact key parity via a Haiku-agent translation pipeline; bilingual catalog content follows the rule "ar content for ar+ma, en content for everything else" via LanguageService::contentLocale + ApiLocaleMiddleware
type: concept
sources: [raw/2026-06-10-i18n-7-locale-expansion.md]
created: 2026-06-10
updated: 2026-06-10
---

# i18n 7-Locale Expansion & Content-Locale Rule

On 2026-06-10 the Beldify storefront expanded from 5 to 7 UI locales by adding Dutch (informal je/jouw) and German (informal du, Zalando register), and — more importantly — reached exact locale parity: a normalized union of 3628 leaf keys with 0 missing keys in every locale. Getting there required resolving long-standing leaf/branch collisions to their code-canonical shapes (`orders.payment_status.*` and `community.category.*` are branches used via dynamic `t()`; `footer.newsletter/shop/returns` are leaves) and fixing latent bugs the parity work exposed: the Arabic footer rendering a raw key, and fr/es order labels showing literal `{{color}}`/`{{size}}` placeholders.

A distinct backend rule now governs which *content* language the bilingual catalog serves, independent of UI locale: **ar content for UI locales ar+ma, en content for en/fr/es/nl/de**. It is implemented by `LanguageService::contentLocale()` and an `ApiLocaleMiddleware` on the api group resolving `?locale=` → `X-Locale` → `Accept-Language` primary subtag against a 7-locale whitelist (never throwing), replacing ~25 scattered binary `$locale === 'ar'` checks. Crucially, the frontend now actually transmits its language — an axios interceptor sets Accept-Language from i18next — fixing the bug where DiscoverFeed hardcoded `locale=ma` and the products page sent nothing, so Darija/Arabic users saw English product names. Category fallback semantics: unknown locales fall back to en (not ar); empty values fall back ar↔en.

The translation pipeline is reusable: pre-split en.json into ≤340-key namespace chunks, fan out one Haiku agent per chunk per language, then merge centrally with structural validation (key parity, placeholder-set equality per key, emptied-value detection, untranslated-ratio heuristic) plus an "identical to en" scan and a per-language reviewer pass to separate cognates from genuine misses. Two operational lessons: agents' self-reported completion counts are unreliable (structural validation is the gate), and locale-file writes must be centralized in the orchestrator to avoid shared-tree write races. Detection order for the UI locale (querystring → cookie → localStorage) and the deliberate Darija default remain untouched; a one-time `LanguageSuggestionBanner` driven by `navigator.languages` suggests but never auto-switches. Backend Blade `lang/` stays ar/en only by design — nl/de are storefront-only.

## See also
- [[sources/2026-06-10-i18n-7-locale-expansion]]
- [[concepts/i18n-t-fallback-vs-locale-value]]
- [[concepts/storefront-home-marketplace-overhaul]] — whose `sort.*`-keys backlog item this work closed
- [[concepts/nextjs-i18n-lint]]
- [[entities/nextjs]]
- [[entities/laravel]]
