/**
 * Tailoring service (brand register) — reference-grade pass — TDD tests.
 *
 * Presentation-only fixes against the impeccable critique:
 *  - Dark editorial strips: bg-indigo-900 (off-scale) -> bg-indigo-950 (Atlas dark token)
 *  - Hex literals in SVG/diagram nodes -> Atlas token classes; eliminate #fea619
 *  - Amber CTAs: bg-amber-400 + text-gray-900 -> shared Button variant="accent"
 *  - Eyebrow slop: ONE eyebrow on the hero only (not above every section)
 *  - 01/02/03 numbered-step scaffolding removed; editorial how-it-works
 *  - Differentiated strips (dark hero + parchment process) + desktop asymmetry
 *  - MAD prices wrapped in .currency-mad
 *  - Muted-text contrast bumps for WCAG AA
 *  - MeasurementForm physical left-1/2 -> logical inset-x-0 centering
 *  - Non-token shadows (shadow-sm/md + raw rgba) -> shadow-atlas-*
 *
 * Source-reading tests (Atlas-compliance pattern) — no DOM render needed.
 *
 * Deliberately NOT covered (out of scope — presentation-only packet):
 *  - Route consolidation of [id] vs tailors/[id] (routing/data change).
 *  - i18n locale JSON population (edits files outside this packet).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const TAILORING = join(SRC, 'app/services/tailoring');

const indexPage = readFileSync(join(TAILORING, 'page.tsx'), 'utf-8');
const profilePage = readFileSync(join(TAILORING, '[id]/page.tsx'), 'utf-8');
const tailorsPage = readFileSync(join(TAILORING, 'tailors/page.tsx'), 'utf-8');
const tailorDetailPage = readFileSync(join(TAILORING, 'tailors/[id]/page.tsx'), 'utf-8');
const measurementsPage = readFileSync(join(TAILORING, 'measurements/page.tsx'), 'utf-8');
const measurementForm = readFileSync(join(SRC, 'components/tailoring/MeasurementForm.tsx'), 'utf-8');

const allFiles = [
  indexPage,
  profilePage,
  tailorsPage,
  tailorDetailPage,
  measurementsPage,
  measurementForm,
];

// ─── FIX 1: dark strips use the indigo-950 Atlas token, not off-scale indigo-900 ─

describe('Tailoring — dark editorial strips use bg-indigo-950 (Atlas dark token)', () => {
  it('no file uses bg-indigo-900 anymore', () => {
    for (const src of allFiles) {
      expect(src).not.toContain('bg-indigo-900');
    }
  });

  it('the index hero + process strips use bg-indigo-950', () => {
    expect(indexPage).toContain('bg-indigo-950');
  });
});

// ─── FIX 2: hex literals removed; #fea619 eliminated ─────────────────────────

describe('Tailoring — drifting hex literals are removed', () => {
  it('eliminates the off-token #fea619 amber everywhere', () => {
    for (const src of allFiles) {
      expect(src.toLowerCase()).not.toContain('#fea619');
    }
  });

  it('removes the #252555 / #3b3b6d hardcoded indigo hexes', () => {
    for (const src of allFiles) {
      expect(src.toLowerCase()).not.toContain('#252555');
      expect(src.toLowerCase()).not.toContain('#3b3b6d');
    }
  });

  it('recolors the diagram nodes/SVG via token classes (amber-500 / indigo-950)', () => {
    expect(measurementForm).toContain('bg-amber-500');
    expect(measurementForm).toContain('stroke-indigo-950');
  });
});

// ─── FIX 3: amber CTAs use the shared accent Button variant ───────────────────

describe('Tailoring — amber CTAs use Button variant="accent" (amber-500/text-amber-950)', () => {
  it('drops the inline bg-amber-400 + text-gray-900 CTA pattern in the index page', () => {
    expect(indexPage).not.toContain('bg-amber-400');
  });

  it('drops the inline bg-amber-400 + text-gray-900 CTA pattern in MeasurementForm', () => {
    expect(measurementForm).not.toContain('bg-amber-400');
    expect(measurementForm).not.toContain('text-gray-900');
  });

  it('uses the accent Button variant for the hero/how-it-works/add-to-cart CTAs', () => {
    expect(indexPage).toContain('variant="accent"');
    expect(measurementForm).toContain('variant="accent"');
  });
});

// ─── FIX 4: eyebrow slop — one eyebrow on the hero only ──────────────────────

describe('Tailoring — index page keeps a single eyebrow (no slop above every section)', () => {
  it('drops the THE PROCESS and OUR ATELIERS section eyebrows', () => {
    expect(indexPage).not.toContain('THE PROCESS');
    expect(indexPage).not.toContain('OUR ATELIERS');
  });
});

// ─── FIX 5: 01/02/03 numbered-step scaffolding removed ───────────────────────

describe('Tailoring — 01/02/03 numbered-step scaffolding is removed', () => {
  it('no longer encodes literal number:"01"/"02"/"03" fields', () => {
    expect(indexPage).not.toMatch(/number:\s*['"]0[123]['"]/);
  });
});

// ─── FIX 6: process strip differentiated to parchment amber-50 ───────────────

describe('Tailoring — the two strips are differentiated (dark hero + parchment process)', () => {
  it('the how-it-works/process section uses a parchment amber-50 surface', () => {
    expect(indexPage).toContain('bg-amber-50');
  });
});

// ─── FIX 7: MAD prices wrapped in .currency-mad ──────────────────────────────

describe('Tailoring — MAD price strings are bidi-isolated with .currency-mad', () => {
  it('wraps the service prices in the tailor detail page', () => {
    expect(tailorDetailPage).toContain('currency-mad');
  });
});

// ─── FIX 8: muted-text contrast bumps ────────────────────────────────────────

describe('Tailoring — muted text meets WCAG AA', () => {
  it('breadcrumbs on dark no longer use the faint text-indigo-300', () => {
    expect(tailorDetailPage).not.toContain('text-indigo-300');
  });

  it('measurement form hints/labels are no longer the faint bare text-indigo-400', () => {
    // Bare body/label text-indigo-400 fails AA; placeholder:text-indigo-400 is the
    // critique-allowed minimum, so only the un-prefixed token is banned.
    expect(measurementForm).not.toMatch(/(?<!placeholder:)text-indigo-400/);
  });

  it('measurement form placeholders are no longer text-indigo-300', () => {
    expect(measurementForm).not.toContain('placeholder:text-indigo-300');
  });
});

// ─── FIX 9: MeasurementForm logical centering (no physical left) ──────────────

describe('Tailoring — MeasurementForm diagram nodes center on the logical axis', () => {
  it('no longer uses the physical left-1/2 centering under dir=rtl', () => {
    expect(measurementForm).not.toContain('left-1/2');
  });
});

// ─── FIX 10: non-token shadows standardized on shadow-atlas-* ─────────────────

describe('Tailoring — elevation standardized on shadow-atlas-* tokens', () => {
  it('removes raw rgba(...) box-shadows from the measurements flow', () => {
    expect(measurementsPage).not.toContain('rgba(37,37,85');
    expect(measurementForm).not.toContain('rgba(37,37,85');
  });

  it('removes loose shadow-sm/shadow-md/shadow-lg from the tailoring files', () => {
    for (const src of allFiles) {
      expect(src).not.toMatch(/\bshadow-(sm|md|lg)\b/);
    }
  });
});
