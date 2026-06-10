/**
 * suggestLocale — pure locale-suggestion helper.
 *
 * Exported from a standalone file so it can be unit-tested without importing
 * the React component (which pulls in browser-only hooks and CSS variables).
 */

/** Locales supported for the banner suggestion. */
export const SUGGESTION_LOCALES = ['en', 'fr', 'es', 'nl', 'de', 'ar'] as const;
export type SuggestionLocale = (typeof SUGGESTION_LOCALES)[number] | 'ma';

/**
 * Given navigator.languages and the current i18n language, returns the locale
 * code we should suggest, or null if no suitable suggestion exists.
 *
 * Rules:
 * - Skip if suggestion matches current.
 * - 'ar-MA' maps to 'ma' (Moroccan Darija).
 * - Other tags: primary subtag must be in SUGGESTION_LOCALES.
 * - First match wins.
 */
export function suggestLocale(
  navLangs: readonly string[],
  current: string
): string | null {
  for (const lang of navLangs) {
    const lower = lang.toLowerCase();

    // Special case: Arabic-Morocco → suggest Darija
    if (lower === 'ar-ma' || lower.startsWith('ar-ma-')) {
      const suggestion = 'ma';
      if (suggestion === current) return null;
      return suggestion;
    }

    // Primary subtag
    const primary = lower.split('-')[0];

    if (SUGGESTION_LOCALES.includes(primary as (typeof SUGGESTION_LOCALES)[number])) {
      const suggestion = primary;
      if (suggestion === current) return null;
      return suggestion;
    }
  }
  return null;
}
