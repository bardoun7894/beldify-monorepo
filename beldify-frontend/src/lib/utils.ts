import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
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

