import i18n, { intlLocale } from '@/i18n/config';

export const formatPrice = (price: string | number) => {
  if (price === undefined || price === null) return '';

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Use the canonical BCP47 mapper so 'ma' → 'ar-MA' (raw 'ma' throws on Safari).
  const locale = intlLocale(i18n.language);

  // Always use the ISO currency code 'MAD' for Moroccan Dirham
  const currencyCode = 'MAD';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(intlLocale(i18n.language), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};
