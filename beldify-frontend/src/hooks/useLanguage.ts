import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();
  const locale = i18n.language || 'ma';

  const dir = (locale === 'ar' || locale === 'ma') ? 'rtl' : 'ltr';
  const language = locale;

  return {
    dir,
    language,
    locale,
    isRTL: dir === 'rtl',
    currentLanguage: locale,
  };
}
