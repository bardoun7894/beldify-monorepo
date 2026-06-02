import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * WS-C P1 frontend regression guards (bugs 8, 10, 11).
 * These follow the repo's source-reading test convention so they are stable
 * regardless of jsdom/render availability.
 */
const SRC = join(__dirname, '..');

const read = (rel: string) => readFileSync(join(SRC, rel), 'utf-8');

describe('bug 8 — booking modal sends real numeric tailor_service ids', () => {
  const page = read('app/services/tailoring/[id]/page.tsx');

  it('does not hardcode string service ids like "custom-suit"', () => {
    expect(page).not.toContain("'custom-suit'");
    expect(page).not.toContain("'alterations'");
  });

  it('renders services from the fetched tailor (real API data)', () => {
    expect(page).toContain('tailor.services');
  });

  it('still parses the selected service id to a number before booking', () => {
    expect(page).toMatch(/parseInt\(selectedService\)/);
  });
});

describe('bug 9 — frontend no longer references leaked user PII', () => {
  const page = read('app/services/tailoring/[id]/page.tsx');
  const service = read('services/tailorService.ts');

  it('detail page does not read tailor.user.email/city', () => {
    expect(page).not.toContain('tailor.user.email');
    expect(page).not.toContain('tailor.user.city');
  });

  it('Tailor type no longer declares an email field', () => {
    expect(service).not.toMatch(/email:\s*string/);
  });
});

describe('bug 10 — buyer tailors list is wired to the real API', () => {
  const list = read('app/services/tailoring/tailors/page.tsx');

  it('imports the tailorService', () => {
    expect(list).toContain("from '@/services/tailorService'");
  });

  it('calls getTailors() instead of using hardcoded mock data', () => {
    expect(list).toContain('tailorService.getTailors');
    expect(list).not.toContain('placeholderTailors');
  });

  it('links to the canonical detail route (collapsed duplicate)', () => {
    expect(list).toContain('/services/tailoring/${tailor.id}');
    expect(list).not.toContain('/services/tailoring/tailors/${tailor.id}');
  });
});

describe('bug 11 — MeasurementForm save/add-to-cart handlers are bound', () => {
  const page = read('app/services/tailoring/measurements/page.tsx');

  it('passes onSave and onAddToCart to MeasurementForm', () => {
    expect(page).toMatch(/<MeasurementForm[^>]*onSave=/);
    expect(page).toMatch(/<MeasurementForm[^>]*onAddToCart=/);
  });

  it('the handlers do real work (persist + toast), not a no-op', () => {
    expect(page).toContain('localStorage.setItem');
    expect(page).toContain('toast.success');
  });
});
