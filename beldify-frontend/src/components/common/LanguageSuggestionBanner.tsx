'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { RTL_LANGUAGES } from '@/i18n/config';

// Import the pure locale-suggestion helper (tests use @/utils/suggestLocale directly).
import { suggestLocale } from '@/utils/suggestLocale';
export { suggestLocale };

// ─── Supported locales for the suggestion banner ─────────────────────────────
type SuggestionLocale = 'en' | 'fr' | 'es' | 'nl' | 'de' | 'ar' | 'ma';

/** Per-locale banner text written IN the suggested language. */
const BANNER_TEXT: Record<SuggestionLocale, string> = {
  nl: 'Liever in het Nederlands?',
  de: 'Lieber auf Deutsch?',
  en: 'Prefer English?',
  fr: 'Préférez-vous le français ?',
  es: '¿Prefieres español?',
  ar: 'هل تفضل العربية؟',
  ma: 'واش تحب الدارجة؟',
};

/** Button labels — in the suggested language. */
const SWITCH_LABEL: Record<SuggestionLocale, string> = {
  nl: 'Schakel over',
  de: 'Wechseln',
  en: 'Switch',
  fr: 'Changer',
  es: 'Cambiar',
  ar: 'تغيير',
  ma: 'بدّل',
};

const DISMISS_ARIA: Record<SuggestionLocale, string> = {
  nl: 'Sluiten',
  de: 'Schließen',
  en: 'Dismiss',
  fr: 'Fermer',
  es: 'Cerrar',
  ar: 'إغلاق',
  ma: 'إغلاق',
};

const DONE_KEY = 'beldify_lang_suggest_done';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LanguageSuggestionBanner() {
  const { i18n } = useTranslation();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only run client-side
    if (typeof window === 'undefined') return;

    // Skip if user already acted on the banner
    try {
      if (localStorage.getItem(DONE_KEY)) return;
    } catch {
      return; // storage blocked — skip banner
    }

    // Skip if user has an explicit locale cookie (they made a deliberate choice)
    if (Cookies.get('NEXT_LOCALE')) return;

    const navLangs: readonly string[] =
      navigator.languages?.length ? navigator.languages : [];

    const result = suggestLocale(navLangs, i18n.language);
    if (result) {
      setSuggestion(result);
      setVisible(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-once — intentional

  const dismiss = () => {
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      // Private mode or storage blocked — suppress banner for session only
    }
    setVisible(false);
  };

  const switchLang = () => {
    if (!suggestion) return;

    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      // Private mode or storage blocked — proceed with language switch anyway
    }
    setVisible(false);

    // Persist locale cookie (same mechanic as LanguageSwitcher)
    Cookies.set('NEXT_LOCALE', suggestion, { path: '/', expires: 365 });

    i18n.changeLanguage(suggestion).then(() => {
      const dir = RTL_LANGUAGES.includes(suggestion) ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = suggestion;
    });
  };

  // Render null until we know whether to show (no layout shift)
  if (!visible || !suggestion) return null;

  const loc = suggestion as SuggestionLocale;
  const isRTLSuggestion = RTL_LANGUAGES.includes(suggestion);

  return (
    <div
      role="banner"
      dir={isRTLSuggestion ? 'rtl' : 'ltr'}
      className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm"
      style={{
        background: 'hsl(var(--primary) / 0.06)',
        borderBottom: '1px solid hsl(var(--primary) / 0.12)',
      }}
    >
      <span className="font-medium" style={{ color: 'hsl(var(--primary))' }}>
        {BANNER_TEXT[loc] ?? BANNER_TEXT['en']}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={switchLang}
          className="px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2"
          style={{
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {SWITCH_LABEL[loc] ?? SWITCH_LABEL['en']}
        </button>

        <button
          onClick={dismiss}
          aria-label={DISMISS_ARIA[loc] ?? 'Dismiss'}
          className="p-1 rounded-full transition-colors duration-150 hover:bg-black/10 focus:outline-none focus-visible:ring-2"
          style={{ color: 'hsl(var(--primary))' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
