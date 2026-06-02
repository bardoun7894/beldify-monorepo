---
title: Tailwind / PostCSS CSS Comment Premature-Close Bug
tags: [tailwind, postcss, css, debugging, build]
created: 2026-06-02
updated: 2026-06-02
sources:
  - daily/2026-06-02.md
---

# Tailwind / PostCSS CSS Comment Premature-Close Bug

## Problem

A `*/` substring **inside** a CSS comment body prematurely terminates the comment block. PostCSS then parses the remainder of the comment text as a real selector, hitting an unexpected `/` token and aborting the entire Tailwind build.

Manifestation: Next.js dev server returns HTTP 500 ("Application error: a server-side exception has occurred") with no useful stack trace in the browser. The actual PostCSS error appears only in the terminal, and only if the Tailwind build is run standalone.

## Root cause example

```css
/* Logical property helpers — use these instead of pl-*/pr-* */
```

The `*/` at position `pl-*` ends the comment. PostCSS sees `pr-* */` as a CSS rule containing a literal `/`, producing:

```
CssSyntaxError: /path/globals.css:190:71: Unexpected '/'
```

## Diagnosis command

Run Tailwind as a standalone CLI — it exits non-zero and prints the **exact file:line:col**:

```bash
npx tailwindcss -i src/app/globals.css -o /tmp/tw.css
```

Do **not** rely on `next dev` error output or vitest test results — both mask this class of error (see [[concepts/tailwind-vitest-false-green]]).

## Fix

Rewrite the comment so no `*/` substring appears inside it:

```css
/* Logical property helpers — prefer these over pl-X / pr-X equivalents */
```

## Why vitest tests don't catch this

String-based vitest tests grep TSX source files for class-name strings. They pass when class names are **present as text in source** — they never invoke PostCSS or compile CSS. A 100/100 vitest run is consistent with a completely broken CSS build. See [[concepts/tailwind-arbitrary-value-slash-pitfall]] for a related false-green scenario.

## Where it happened

- **File**: `beldify-frontend/src/app/globals.css`, line 190
- **Session**: 2026-06-02 (session `bdb93bad`)
- **Impact**: HTTP 500 on every Next.js page; masked by 100/100 vitest pass

## Prevention

Grep for `\*/` inside CSS comment bodies before committing:

```bash
grep -n '\*/' src/app/globals.css | grep -v '^[0-9]*:\s*\*/'
```

Or use a pre-commit hook that runs `npx tailwindcss -i src/app/globals.css -o /dev/null` and fails the commit on non-zero exit.
