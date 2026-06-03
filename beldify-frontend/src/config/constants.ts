export const CONTABO_CONFIG = {
  ENDPOINT: process.env.NEXT_PUBLIC_CONTABO_ENDPOINT || 'https://eu2.contabostorage.com',
  ACCOUNT_ID: process.env.NEXT_PUBLIC_CONTABO_ACCOUNT_ID || 'c7737d32901c47be91e8263ad074fd38',
  BUCKET: process.env.NEXT_PUBLIC_CONTABO_BUCKET || 'beldify1storage',
  get BASE_URL() {
    return `${this.ENDPOINT}/${this.ACCOUNT_ID}/${this.BUCKET}`;
  },
} as const;

// Keep S3_CONFIG as an alias to CONTABO_CONFIG for backward compatibility
export const S3_CONFIG = CONTABO_CONFIG;

// API URL for backend services — single source of truth
// Fall back to production URL rather than crashing on missing env var.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://pro.beldify.com';
export const API_BASE_URL = API_URL;
