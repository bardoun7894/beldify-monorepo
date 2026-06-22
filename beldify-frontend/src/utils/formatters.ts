import i18n from '@/i18n/config';

export const formatPrice = (price: string | number) => {
  if (price === undefined || price === null) return '';
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Get current language
  const currentLang = i18n.language || 'ma';
  
  // Define locale and currency format based on language
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'fr': 'fr-FR',
    'ar': 'ar-MA',
    'ma': 'ar-MA',
    'es': 'es-ES'
  };
  
  const locale = localeMap[currentLang] || 'fr-FR';
  
  // Always use the ISO currency code 'MAD' for Moroccan Dirham
  const currencyCode = 'MAD';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};

const dateLocaleMap: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-MA',
  ma: 'ar-MA',
  es: 'es-ES',
};

export const formatDate = (date: Date) => {
  const locale = dateLocaleMap[i18n.language || 'fr'] || 'fr-FR';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};
