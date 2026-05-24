import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';

export function useLanguage() {
  const { i18n } = useTranslation();
  const searchParams = useSearchParams();
  const locale = searchParams?.get('locale') || 'en';

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const language = locale;

  return {
    dir,
    language,
    locale,
    isRTL: dir === 'rtl',
    currentLanguage: locale, // Added for compatibility with traditional wear components
  };
}
