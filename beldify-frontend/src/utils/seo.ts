/**
 * Server-side SEO/OpenGraph helpers for rich link previews when a Beldify
 * page is shared to WhatsApp / Facebook. Keep this dependency-free so it can
 * run inside `generateMetadata` (server component) without pulling client code.
 */

/** Canonical public frontend origin (where pages are served). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beldify.com';

/** Backend API origin. */
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com';

/** Where bare relative image paths (e.g. "products/x.jpg") are served from. */
export const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://pro.beldify.com/storage';

/**
 * Resolve any image reference to an ABSOLUTE URL. OG/Twitter previews require
 * absolute URLs — relative paths silently fail in WhatsApp/Facebook crawlers.
 * Mirrors the client `buildImageUrl` rules but always returns absolute.
 */
export function absoluteImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;            // already absolute
  if (url.startsWith('/')) return `${SITE_URL}${url}`;  // frontend public asset
  return `${STORAGE_BASE}/${url.replace(/^\/+/, '')}`;  // bare path → storage
}

/** Strip HTML tags and collapse whitespace from API rich-text descriptions. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Truncate to a preview-friendly length without cutting mid-word. */
export function truncate(input: string, max = 160): string {
  if (input.length <= max) return input;
  return input.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** Format a numeric/string amount as MAD for preview copy. */
export function formatMad(amount: string | number | null | undefined): string | null {
  if (amount === null || amount === undefined || amount === '') return null;
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return null;
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)} MAD`;
}
