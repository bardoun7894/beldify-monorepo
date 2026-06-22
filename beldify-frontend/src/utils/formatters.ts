import i18n, { intlLocale } from '@/i18n/config';

export const formatPrice = (price: string | number) => {
  if (price === undefined || price === null) return '';

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return '';

  return new Intl.NumberFormat(intlLocale(i18n.language), {
    style: 'currency',
    currency: 'MAD',
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
