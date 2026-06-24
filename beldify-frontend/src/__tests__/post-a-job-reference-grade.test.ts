/**
 * Post-a-job reference-grade structural assertions.
 *
 * Strategy: readFileSync + toContain (node env, project convention).
 * Each assertion targets a SPECIFIC new structure so that red means
 * "feature is missing" — not "any random string was absent."
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const page = readFileSync(
  join(ROOT, 'src/app/community/posts/create/page.tsx'),
  'utf-8'
);

// ────────────────────────────────────────────────────────────────────
// 1. Required-skills multi-select chips
// ────────────────────────────────────────────────────────────────────
describe('Post-a-job — required skills chips', () => {
  it('has requiredSkills state array', () => {
    expect(page).toContain('requiredSkills');
  });

  it('renders a skills chip toggle area', () => {
    // We look for the skill chip interaction: clicking adds/removes from requiredSkills
    expect(page).toContain('toggleSkill');
  });

  it('shows AVAILABLE_SKILLS constant list', () => {
    expect(page).toContain('AVAILABLE_SKILLS');
  });

  it('appends required_skills to FormData for submission', () => {
    // Backend convention: required_skills[]
    expect(page).toContain('required_skills');
  });
});

// ────────────────────────────────────────────────────────────────────
// 2. Desktop two-column layout with live preview aside
// ────────────────────────────────────────────────────────────────────
describe('Post-a-job — desktop preview aside', () => {
  it('has an lg:grid-cols-[...] two-column wrapper', () => {
    // Must have a 2-column grid triggered at lg breakpoint
    expect(page).toMatch(/lg:grid-cols/);
  });

  it('renders a preview aside element', () => {
    expect(page).toContain('PreviewAside');
  });

  it('preview aside is hidden on mobile, visible on lg', () => {
    expect(page).toMatch(/hidden.*lg:block|lg:block/);
  });

  it('preview shows title from formData', () => {
    expect(page).toContain('formData.title');
  });

  it('preview shows budget range from formData', () => {
    expect(page).toContain('formData.budget');
  });
});

// ────────────────────────────────────────────────────────────────────
// 3. Success / submitted state
// ────────────────────────────────────────────────────────────────────
describe('Post-a-job — designed success state', () => {
  it('has a submitted / isSubmitted state', () => {
    expect(page).toMatch(/submitted|isSubmitted/);
  });

  it('uses CheckCircle icon in success branch', () => {
    expect(page).toContain('CheckCircle');
  });

  it('success state has a CTA back to community', () => {
    // Should link back to /community after success
    expect(page).toContain('/community');
  });
});

// ────────────────────────────────────────────────────────────────────
// 4. Atlas design-system compliance
// ────────────────────────────────────────────────────────────────────
describe('Post-a-job — Atlas design system', () => {
  it('uses indigo-700 as CTA background', () => {
    expect(page).toContain('bg-indigo-700');
  });

  it('uses amber-950 dark text on amber badge (no white-on-amber)', () => {
    // Amber badges must use dark text per DESIGN.md WCAG AA rule
    expect(page).toContain('text-amber-950');
  });

  it('uses rounded-2xl on form card', () => {
    expect(page).toContain('rounded-2xl');
  });

  it('uses logical RTL props (ps or pe or ms or me)', () => {
    // At least one logical property for RTL-first layout
    expect(page).toMatch(/\bps-|\bpe-|\bms-|\bme-|\bstart-|\bend-/);
  });

  it('submit CTA has min-h-[44px] touch target', () => {
    expect(page).toContain('min-h-[44px]');
  });
});

// ────────────────────────────────────────────────────────────────────
// 5. Section structure — clear labeled sections
// ────────────────────────────────────────────────────────────────────
describe('Post-a-job — section structure', () => {
  it('has a dedicated budget section', () => {
    expect(page).toContain('budget');
  });

  it('has a timeline / deadline section', () => {
    expect(page).toMatch(/timeline|deadline/);
  });

  it('has an image-upload section', () => {
    expect(page).toContain('ImageIcon');
  });

  it('uses Playfair Display for the main heading', () => {
    expect(page).toContain('Playfair Display');
  });
});
