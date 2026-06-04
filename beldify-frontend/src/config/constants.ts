// Contabo Object Storage was retired (creds return 401). Images are served from
// the backend's local public disk. Relative image paths from the API
// (e.g. "products/x.jpg") resolve against BASE_URL = {origin}/storage.
export const CONTABO_CONFIG = {
  ENDPOINT: process.env.NEXT_PUBLIC_STORAGE_ORIGIN || 'https://pro.beldify.com',
  ACCOUNT_ID: '',
  BUCKET: 'storage',
  get BASE_URL() {
    return process.env.NEXT_PUBLIC_STORAGE_URL || 'https://pro.beldify.com/storage';
  },
} as const;

// Keep S3_CONFIG as an alias to CONTABO_CONFIG for backward compatibility
export const S3_CONFIG = CONTABO_CONFIG;

// API URL for backend services — single source of truth
// Fall back to production URL rather than crashing on missing env var.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://pro.beldify.com';
export const API_BASE_URL = API_URL;
