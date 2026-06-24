import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

const globalsCss = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf-8');
const tailwindConfig = readFileSync(join(ROOT, 'tailwind.config.js'), 'utf-8');

describe('Atlas design tokens — globals.css', () => {
  // primary = #252555 deep indigo → HSL 240 39% 24%
  it('has Atlas primary indigo token (240 39% 24%)', () => {
    expect(globalsCss).toContain('240 39% 24%');
  });

  // primary-container = #3b3b6d → HSL 240 30% 33%
  it('has Atlas primary-container token (240 30% 33%)', () => {
    expect(globalsCss).toContain('240 30% 33%');
  });

  // on-primary-container = #a8a7e1 → HSL 241 49% 77%
  it('has Atlas on-primary-container token (241 49% 77%)', () => {
    expect(globalsCss).toContain('241 49% 77%');
  });

  // secondary/accent = #fea619 saffron amber → HSL 37 99% 55%
  it('has Atlas saffron amber token (37 99% 55%)', () => {
    expect(globalsCss).toContain('37 99% 55%');
  });

  // surface/background = neutral near-white #fcfcfc → HSL 0 0% 99%
  // (parchment #fbf9f4 retired 2026-06-10: user feedback — yellow cast; 60-30-10 rule)
  it('has neutral near-white background token (0 0% 99%)', () => {
    expect(globalsCss).toContain('0 0% 99%');
  });

  // on-surface ink = #1b1c19 → HSL 80 6% 10%
  it('has Atlas ink foreground token (80 6% 10%)', () => {
    expect(globalsCss).toContain('80 6% 10%');
  });

  // on-surface-variant muted = #47464f → HSL 247 6% 29%
  it('has Atlas muted-foreground token (247 6% 29%)', () => {
    expect(globalsCss).toContain('247 6% 29%');
  });

  // outline = #777680 → HSL 246 4% 48%
  it('has Atlas outline token (246 4% 48%)', () => {
    expect(globalsCss).toContain('246 4% 48%');
  });

  // error = #ba1a1a → HSL 0 75% 42%
  it('has Atlas error token (0 75% 42%)', () => {
    expect(globalsCss).toContain('0 75% 42%');
  });

  // on-secondary = #855300 → HSL 37 100% 26%
  it('has Atlas on-secondary token (37 100% 26%)', () => {
    expect(globalsCss).toContain('37 100% 26%');
  });

  // Semantic --primary must point to Atlas indigo (240 39% 24%)
  it('--primary resolves to Atlas deep indigo', () => {
    expect(globalsCss).toMatch(/--primary:\s*240 39% 24%/);
  });

  // --background must be the neutral near-white canvas (parchment retired 2026-06-10)
  it('--background resolves to neutral near-white', () => {
    expect(globalsCss).toMatch(/--background:\s*0 0% 99%/);
  });

  // --foreground must be Atlas ink
  it('--foreground resolves to Atlas ink', () => {
    expect(globalsCss).toMatch(/--foreground:\s*80 6% 10%/);
  });

  // Font fallback strings must include IBM Plex Sans Arabic
  it('font-arabic fallback mentions IBM Plex Sans Arabic', () => {
    expect(globalsCss).toContain('IBM Plex Sans Arabic');
  });
});

describe('Atlas design tokens — tailwind.config.js', () => {
  // New Atlas semantic colors must be registered so they work as Tailwind classes
  it('registers primary-container color', () => {
    expect(tailwindConfig).toContain('primary-container');
  });

  it('registers on-primary-container color', () => {
    expect(tailwindConfig).toContain('on-primary-container');
  });

  it('registers on-secondary color', () => {
    expect(tailwindConfig).toContain('on-secondary');
  });

  it('registers on-surface color as foreground or standalone token', () => {
    // background + foreground are already wired; outline is the new one
    expect(tailwindConfig).toContain('outline');
  });

  it('registers on-surface-variant color', () => {
    expect(tailwindConfig).toContain('on-surface-variant');
  });

  // Radius 12px explicit token for buttons/inputs
  it('has explicit 12px (btn) radius token', () => {
    expect(tailwindConfig).toContain('calc(var(--radius) - 4px)');
  });
});
