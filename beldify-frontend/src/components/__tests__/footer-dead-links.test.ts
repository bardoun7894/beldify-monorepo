/**
 * TDD RED→GREEN — Footer dead-link and removed-link fixes.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const footerSrc = readFileSync(
  join(__dirname, '../layout/Footer.tsx'),
  'utf-8'
);

describe('Footer.tsx — dead link fixes', () => {
  it('does NOT link to /journal (removed)', () => {
    expect(footerSrc).not.toMatch(/href.*['"]\/journal['"]/);
  });

  it('does NOT link to /careers (removed)', () => {
    expect(footerSrc).not.toMatch(/href.*['"]\/careers['"]/);
  });

  it('does NOT link to /press (removed)', () => {
    expect(footerSrc).not.toMatch(/href.*['"]\/press['"]/);
  });

  it('does NOT link to /tailoring (fixed to /services/tailoring)', () => {
    expect(footerSrc).not.toMatch(/href.*['"]\/tailoring['"]/);
  });

  it('links tailoring to /services/tailoring', () => {
    expect(footerSrc).toContain('/services/tailoring');
  });

  it('links FAQ to /faqs not /faq', () => {
    expect(footerSrc).not.toMatch(/href.*['"]\/faq['"]/);
    expect(footerSrc).toContain('/faqs');
  });
});
