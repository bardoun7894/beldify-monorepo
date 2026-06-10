import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * WS-C bug 10: the duplicate tailor-detail route is collapsed — it must now
 * redirect to the canonical /services/tailoring/[id] page instead of rendering
 * its old mock data.
 */
const pageSrc = readFileSync(join(__dirname, '../page.tsx'), 'utf-8');

describe('services/tailoring/tailors/[id] — collapsed duplicate route', () => {
  it('redirects to the canonical detail route', () => {
    expect(pageSrc).toContain("redirect(`/services/tailoring/${id}`)");
  });

  it('no longer contains mock tailor-detail content', () => {
    expect(pageSrc).not.toContain('content.tailorDetail');
    expect(pageSrc).not.toContain("'use client'");
  });
});
