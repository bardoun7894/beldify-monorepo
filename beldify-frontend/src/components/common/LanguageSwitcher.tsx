'use client';

import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu } from '@headlessui/react';
import { useDirection } from '@/hooks/useDirection';
import { LOCALES, type Locale } from '@/middleware';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';
import { RTL_LANGUAGES } from '@/i18n/config';

/**
 * Language configuration — flags removed (SVG assets not bundled).
 * The trigger button shows a typographic chip with the 2-letter code
 * styled using Atlas secondary (indigo) tokens.
 */
const LANGUAGE_CONFIG: Record<
  string,
  { name: string; label: string }
> = {
  ma: {
    name: 'الدارجة المغربية',
    label: 'الدارجة المغربية - MA',
  },
  en: {
    name: 'English',
    label: 'English - EN',
  },
  ar: {
    name: 'العربية',
    label: 'العربية - AR',
  },
  fr: {
    name: 'Français',
    label: 'Français - FR',
  },
  es: {
    name: 'Español',
    label: 'Español - ES',
  },
  nl: {
    name: 'Nederlands',
    label: 'Nederlands - NL',
  },
  de: {
    name: 'Deutsch',
    label: 'Deutsch - DE',
  },
};

const DEFAULT_CONFIG = {
  name: 'English',
  label: 'English - EN',
};

/** Typographic chip showing the 2-letter locale code, styled with Atlas indigo tint. */
function LocaleChip({ code }: { code: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-bold tracking-wider leading-none select-none"
      style={{
        background: 'hsl(var(--secondary) / 0.12)',
        color: 'hsl(var(--primary))',
        border: '1px solid hsl(var(--secondary) / 0.25)',
      }}
    >
      {code.toUpperCase()}
    </span>
  );
}

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDirection } = useDirection();

  const switchLanguage = (newLanguage: Locale) => {
    // Create new URL with updated locale
    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', newLanguage);

    // Update cookie — 365-day persistence
    Cookies.set('NEXT_LOCALE', newLanguage, {
      path: '/',
      expires: 365,
    });

    // Change language and direction
    i18n.changeLanguage(newLanguage).then(() => {
      const dir = RTL_LANGUAGES.includes(newLanguage) ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = newLanguage;

      // Update URL without page reload
      const url = window.location.pathname + '?' + params.toString();
      router.push(url);
    });
  };

  const isRTL = RTL_LANGUAGES.includes(i18n.language);
  const currentCode = i18n.language in LANGUAGE_CONFIG ? i18n.language : 'en';
  const currentConfig = LANGUAGE_CONFIG[currentCode] ?? DEFAULT_CONFIG;

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div className="relative z-[100]">
            <Menu.Button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 rounded-md border border-gray-200">
              <LocaleChip code={currentCode} />
              <span>{currentConfig.label}</span>
              <svg
                className={`h-5 w-5 ${isRTL ? 'transform rotate-180' : ''} ${
                  open ? 'rotate-180' : ''
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Menu.Button>
          </div>

          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
            <div className="py-1">
              {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
                <Menu.Item key={code}>
                  {({ active }) => (
                    <button
                      onClick={() => switchLanguage(code as Locale)}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm',
                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700',
                        i18n.language === code ? 'bg-indigo-50 text-indigo-600' : ''
                      )}
                    >
                      <LocaleChip code={code} />
                      <span>{config.name}</span>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </>
      )}
    </Menu>
  );
};

export default LanguageSwitcher;
