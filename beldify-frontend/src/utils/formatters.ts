import i18n from '@/i18n/config';

export const formatPrice = (price: string | number) => {
  if (price === undefined || price === null) return '';

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Get current language
  const currentLang = i18n.language || 'ma';

  // Define locale and currency word based on language.
  // We deliberately avoid `Intl.NumberFormat({ style: 'currency', currency: 'MAD' })`
  // because for ar-MA that emits the "د.م.‏" abbreviation (with U+200F), which
  // drifts from the explicit "درهم" word used elsewhere on the site (cards,
  // checkout, orders). Keep a single canonical rendering site-wide.
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'fr': 'fr-FR',
    'ar': 'ar-MA',
    'ma': 'ar-MA',
    'es': 'es-ES',
  };
  const locale = localeMap[currentLang] || 'fr-MA';
  const currencyWord = currentLang === 'en' || currentLang === 'fr' || currentLang === 'es' ? 'MAD' : 'درهم';

  return `${numericPrice.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currencyWord}`;
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-MA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};
