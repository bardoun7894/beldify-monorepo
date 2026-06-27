---
name: i18n t() Fallback vs Locale Value
description: "t('key','fallback') only uses the fallback when the key is absent from locale files — if the key exists with an old English value, t() returns the locale value, silently ignoring the fallback"
type: concept
tags: [migration, cd, atlas, i18n]
sources: [daily/2026-05-24.md]
created: "2026-05-24"
updated: "2026-05-24"
---
# i18n t() Fallback vs Locale Value

## The Misconception

Developers sometimes write:

```tsx
{t('nav.home', 'Home')}
```

…expecting the `'Home'` fallback to appear whenever the translation is missing or stale. **This is wrong.** The fallback only fires if the key is **absent** from all locale files. If the key exists — even with an outdated English value — `t()` returns whatever is in the locale file and ignores the fallback string entirely.

## Why It Matters

During the Beldify Atlas frontend migration (Phase 1–4), parallel agents added `t()` wrappers to ~300 hard-coded strings but never added the corresponding keys to the JSON locale files. Because the key was absent, the English fallback rendered correctly in the browser — passing visual dogfood checks. But the Phase 4 QA/reviewer pass revealed **245 missing translation keys** across the 5 locale files (`en`, `ar`, `fr`, `ber`, `darija`).

```
// Visual check passed — user sees "Home" (the fallback)
{t('nav.home', 'Home')}

// But the locale files have no 'nav.home' key → other locales show nothing
// ar.json: {}  ← 'nav.home' missing → shows '' or falls back depending on i18n config
```

## The Correct Pattern

1. Wrap the string with `t()`.
2. **Immediately** add the key to all locale JSON files.
3. Never rely on the fallback string as a long-term substitute for a real locale entry.

```json
// en.json
{ "nav": { "home": "Home" } }

// ar.json
{ "nav": { "home": "الرئيسية" } }
```

## Detection

Run the i18n lint script after any migration pass:

```bash
cd beldify-frontend && npm run lint:i18n
```

This flags keys present in `t()` calls but absent from locale files. The Phase 4 QA pass found 245 such gaps — all scheduled for Phase 5 remediation.

## Rule

> Adding a `t()` wrapper without adding the key to locale files is incomplete work. The fallback string is a development convenience, not a localization strategy.
