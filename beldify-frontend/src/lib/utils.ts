import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getImageUrl } from '@/utils/imageUtils';
import { S3_CONFIG } from '@/config/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder-product.svg';

  // If it's already a fully qualified URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative URL from the root
  if (url.startsWith('/')) {
    return url;
  }

  // For all other cases, use S3 bucket
  return `${S3_CONFIG.BASE_URL}/${url}`;
}

export function formatAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return '0.00';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return numPrice.toFixed(2);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
