'use client';

import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu } from '@headlessui/react';
import { useDirection } from '@/hooks/useDirection';
import { LOCALES, type Locale } from '@/middleware';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { RTL_LANGUAGES } from '@/i18n/config';

const DEFAULT_CONFIG = {
  name: 'English',
  flag: '/images/flags/us.svg',
  label: 'English - EN',
};

const LANGUAGE_CONFIG = {
  ma: {
    name: 'الدارجة المغربية',
    flag: '/images/flags/ma.svg',
    label: 'الدارجة المغربية - MA',
  },
  en: {
    name: 'English',
    flag: '/images/flags/us.svg',
    label: 'English - EN',
  },
  ar: {
    name: 'العربية',
    flag: '/images/flags/sa.svg',
    label: 'العربية - AR',
  },
  fr: {
    name: 'Français',
    flag: '/images/flags/fr.svg',
    label: 'Français - FR',
  },
  es: {
    name: 'Español',
    flag: '/images/flags/es.svg',
    label: 'Español - ES',
  },
};

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDirection } = useDirection();

  const switchLanguage = (newLanguage: Locale) => {
    // Create new URL with updated locale
    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', newLanguage);

    // Update cookie
    Cookies.set('NEXT_LOCALE', newLanguage, {
      path: '/',
      expires: 365, // 1 year
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

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div className="relative z-[100]">
            <Menu.Button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 rounded-md border border-gray-200">
              <Image
                src={LANGUAGE_CONFIG[i18n.language as Locale]?.flag ?? DEFAULT_CONFIG.flag}
                alt={LANGUAGE_CONFIG[i18n.language as Locale]?.name ?? DEFAULT_CONFIG.name}
                width={20}
                height={15}
                className="rounded-sm w-5 h-auto" // Fixed size with proper aspect ratio
              />
              <span>{LANGUAGE_CONFIG[i18n.language as Locale]?.label ?? DEFAULT_CONFIG.label}</span>
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
                      <Image
                        src={config.flag}
                        alt={config.name}
                        width={20}
                        height={20}
                        className="rounded-sm"
                      />
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
