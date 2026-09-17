/**
 * TDD tests — Batch A (mobile table reflow) + Batch B (a11y quick wins).
 * All tests read source files directly — no jsdom overhead.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');

// ── Batch B — Accessibility quick wins ───────────────────────────────────────

describe('Batch B — SecuritySettings.tsx password toggle uses t() for aria-label', () => {
  const src = () => read('src/app/profile/components/SecuritySettings.tsx');

  it('show/hide toggle aria-label uses t() with fallback strings, not hardcoded English', () => {
    const source = src();
    // Must NOT have bare hardcoded strings like 'Hide password' outside of t()
    // The aria-label must be wrapped in t(...)
    expect(source).not.toMatch(/aria-label=\{show \? 'Hide password' : 'Show password'\}/);
    expect(source).not.toMatch(/aria-label=\{show \? "Hide password" : "Show password"\}/);
  });

  it('show/hide toggle aria-label is state-driven via t() calls', () => {
    const source = src();
    // Must use t() for both states
    expect(source).toMatch(/aria-label=\{show\s*\?\s*t\s*\(/);
  });
});

describe('Batch B — reset-password/page.tsx password toggle aria-labels', () => {
  const src = () => read('src/app/reset-password/page.tsx');

  it('new-password toggle aria-label is state-driven using t()', () => {
    const source = src();
    // showPassword toggle must use t() in aria-label
    expect(source).toMatch(/showPassword\s*\?\s*t\s*\(/);
  });

  it('confirm-password toggle aria-label is state-driven using t()', () => {
    const source = src();
    // showConfirm toggle must use t() in aria-label
    expect(source).toMatch(/showConfirm\s*\?\s*t\s*\(/);
  });
});
