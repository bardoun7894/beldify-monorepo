import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const config = readFileSync(join(ROOT, 'src/i18n/config.ts'), 'utf-8');

/**
 * Darija ('ma') must be the true default language.
 * Bug fixed: LanguageDetector's `navigator`/`htmlTag` lookups were overriding the
 * `ma` default on first visit, so a non-Moroccan browser saw English/French instead.
 */
describe('i18n — Darija (ma) is the default language', () => {
  it("sets lng to 'ma'", () => {
    expect(config).toMatch(/lng:\s*'ma'/);
  });

  it("lists 'ma' first in fallbackLng", () => {
    const m = config.match(/fallbackLng:\s*\[([^\]]*)\]/);
    expect(m).toBeTruthy();
    const first = m![1].split(',')[0].replace(/['"\s]/g, '');
    expect(first).toBe('ma');
  });

  it('does NOT let navigator (browser language) override the default', () => {
    const m = config.match(/order:\s*\[([^\]]*)\]/);
    expect(m).toBeTruthy();
    const order = m![1];
    expect(order).not.toContain('navigator');
    expect(order).not.toContain('htmlTag');
  });

  it('reads the cookie the LanguageSwitcher writes (NEXT_LOCALE)', () => {
    expect(config).toMatch(/lookupCookie:\s*'NEXT_LOCALE'/);
  });

  it('honors an explicit ?locale= querystring', () => {
    const m = config.match(/order:\s*\[([^\]]*)\]/);
    expect(m![1]).toContain('querystring');
    expect(config).toMatch(/lookupQuerystring:\s*'locale'/);
  });

  it('keeps ma in the RTL language set', () => {
    expect(config).toMatch(/RTL_LANGUAGES\s*=\s*\[[^\]]*'ma'/);
  });
});
