import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import JSON files with type declarations
type LocaleType = {
  profile?: {
    [key: string]: any;
  };
  [key: string]: any;
};

import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ma from './locales/ma.json';

// Type assertions for imported JSON
const enLocale = en as LocaleType;
const arLocale = ar as LocaleType;
const frLocale = fr as LocaleType;
const esLocale = es as LocaleType;
const maLocale = ma as LocaleType;

export const RTL_LANGUAGES = ['ar', 'ma'];

// Create a custom i18n instance
const createI18n = () => {
  const i18nInstance = i18n.createInstance();

  i18nInstance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          common: enLocale,
          profile: enLocale.profile || {},
        },
        ar: {
          common: arLocale,
          profile: arLocale.profile || {},
        },
        fr: {
          common: frLocale,
          profile: frLocale.profile || {},
        },
        es: {
          common: esLocale,
          profile: esLocale.profile || {},
        },
        ma: {
          common: maLocale,
          profile: maLocale.profile || {},
        },
      },
      defaultNS: 'common',
      lng: 'ma', // Set default language to Moroccan Arabic
      fallbackLng: ['ma', 'ar', 'fr', 'en'],
      detection: {
        order: ['path', 'htmlTag', 'cookie', 'localStorage', 'navigator'],
        lookupFromPathIndex: 0,
        caches: ['cookie', 'localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false, // Disable Suspense to avoid hydration issues
      },
      saveMissing: false,
      missingKeyHandler: (lng, ns, key) => {
        console.warn(`Missing translation: ${lng}.${ns}.${key}`);
      },
    });

  // Add error handling for language changes
  i18nInstance.on('failedLoading', (lng, ns, msg) => {
    console.error(`Failed loading ${lng} ${ns}:`, msg);
  });

  return i18nInstance;
};

// Initialize i18n instance
const i18nInstance = createI18n();

// Only run this code in the browser
type DocumentWithDir = Document & {
  documentElement: HTMLElement & {
    dir?: string;
    lang?: string;
  };
};

if (typeof window !== 'undefined') {
  const initialLanguage = i18nInstance.language || 'ma';
  const initialDir = RTL_LANGUAGES.includes(initialLanguage) ? 'rtl' : 'ltr';
  
  const doc = document as DocumentWithDir;
  doc.documentElement.dir = initialDir;
  doc.documentElement.lang = initialLanguage;

  // Listen for language changes and update direction
  i18nInstance.on('languageChanged', (lang: string) => {
    const dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
    doc.documentElement.dir = dir;
    doc.documentElement.lang = lang;
  });
}

// Function to sync URL locale with i18n
export function syncUrlLocale() {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const locale = url.searchParams.get('locale');
    if (locale && i18nInstance.language !== locale) {
      i18nInstance.changeLanguage(locale);
    }
  }
}

export default i18nInstance;
