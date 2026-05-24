import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const RTL_LANGUAGES = ['ar', 'ma'];

export const useDirection = () => {
  const { i18n } = useTranslation();

  const setDirection = (language: string) => {
    const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  };

  useEffect(() => {
    setDirection(i18n.language);
  }, [i18n.language]);

  return {
    isRTL: RTL_LANGUAGES.includes(i18n.language),
    currentLang: i18n.language,
    setDirection,
  };
};
