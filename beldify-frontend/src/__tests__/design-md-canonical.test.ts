/**
 * TDD — B1: DESIGN.md states the canonical Atlas palette + inverted-token caveat.
 *
 * The frontend DESIGN.md is the human-facing design reference. It must:
 *  - name the canonical brand color Deep Indigo #252555
 *  - name the 10% accent Saffron Amber #fea619
 *  - point at globals.css as the source of truth for tokens
 *  - call out the inverted Tailwind token caveat (primary=amber, secondary=indigo)
 *    so nobody does a global rename and breaks button.tsx / PWA banners.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DESIGN_MD = join(__dirname, '..', '..', 'DESIGN.md');
const read = () => readFileSync(DESIGN_MD, 'utf-8');

describe('B1 — frontend DESIGN.md is canonical', () => {
  it('DESIGN.md exists', () => {
    expect(existsSync(DESIGN_MD)).toBe(true);
  });

  it('names Deep Indigo #252555 as the brand color', () => {
    const md = read();
    expect(md).toMatch(/#252555/i);
    expect(md).toMatch(/indigo/i);
  });

  it('names Saffron Amber #fea619 as the 10% accent', () => {
    const md = read();
    expect(md).toMatch(/#fea619/i);
    expect(md).toMatch(/amber/i);
  });

  it('points at globals.css as the source of truth', () => {
    expect(read()).toMatch(/globals\.css/);
  });

  it('calls out the inverted Tailwind token caveat', () => {
    const md = read().toLowerCase();
    expect(md).toMatch(/invert/);
    // mentions both that primary maps to amber and secondary maps to indigo
    expect(md).toMatch(/primary/);
    expect(md).toMatch(/secondary/);
    expect(md).toMatch(/atlas-primary|atlas-secondary|hsl\(var\(--primary\)\)/);
  });
});
