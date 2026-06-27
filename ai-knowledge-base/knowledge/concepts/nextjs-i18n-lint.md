---
name: Next.js i18n Lint
description: "Custom static-analysis script (scripts/i18n-lint.mjs) that scans JSX text nodes and HTML attribute values for untranslated literals, with known gap for JS string arrays"
type: concept
tags: [migration, html, pattern, atlas, i18n, ui]
sources: [daily/2026-05-24.md]
created: "2026-05-25"
updated: "2026-05-25"
---
# Next.js i18n Lint

`scripts/i18n-lint.mjs` is a project-local static analyser that walks the Next.js `src/` tree and reports JSX text nodes and HTML attribute values (`title`, `aria-label`, `placeholder`, `alt`) that appear to be untranslated English literals.

## How It Works

The script uses a simple heuristic: if a JSX text node or relevant HTML attribute contains ASCII alphabetic characters and is not already wrapped in a `t()` call (or equivalent), it's flagged as a candidate. It outputs a file-by-file table of candidates with surrounding context.

```bash
node scripts/i18n-lint.mjs | head -40
```

## Baseline and Progress

| Milestone | Candidates | Files |
|---|---|---|
| Pre-migration baseline | 271 | 62 |
| After Phase 2 (layout/nav) | ~180 | ~45 |
| After Phase 3 (content pages) | 78 | ~20 |

## Known False Negative: JS String Arrays

The script **does not** detect untranslated literals inside plain JS data structures. FAQ items, feature lists, and step arrays defined as:

```js
const items = [
  { q: 'How do I create an account?', a: 'Click Sign Up…' },
];
```

are invisible to the linter because they are not JSX text nodes. Migrating these requires manually finding every data array and either:

1. Moving them into locale JSON files and referencing by key, or
2. Wrapping with `t('faq.item_0_q', 'How do I create…')` and adding the key to all locale files.

## The `t()` Wrapper vs Locale Key Gap

During the Atlas frontend migration Phase 2/3 fan-out, workers added `t('key', 'fallback')` wrappers to satisfy the linter but did **not** add the corresponding keys to the five locale JSON files (`en.json`, `ar.json`, `fr.json`, `ber.json`, `es.json`). This meant:

- The linter reported 0 new candidates (wrappers present) ✓
- The app silently rendered the English fallback in all locales ✗
- QA Phase 4 found **245 missing locale keys** scattered across the codebase

This is a variant of the pattern documented in [[concepts/i18n-t-fallback-vs-locale-value]]: `t('key', 'fallback')` only uses the fallback when the key is absent from the *current locale's* JSON — but if the key simply never exists in any locale, the fallback wins everywhere and the bug is invisible during English-locale testing.

## Recommended Workflow

1. Run `node scripts/i18n-lint.mjs` before any PR touching UI files.
2. For each flagged line, add both the `t()` wrapper **and** the key to all five locale files in the same commit.
3. Separately grep for JS data arrays (`const.*= \[`, `items =`, `steps =`) and audit manually — the linter will not catch these.
4. Use the FAQ index-based key pattern for list items: `t('faq.items.0.question')`, `t('faq.items.1.question')`, etc.

## Related

- [[concepts/i18n-t-fallback-vs-locale-value]] — the core `t()` fallback pitfall
- [[concepts/atlas-frontend-migration]] — Phase 3/4 context where gap was discovered
