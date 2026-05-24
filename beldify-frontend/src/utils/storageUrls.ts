import { CONTABO_CONFIG } from '@/config/constants';

/**
 * Converts various storage URL formats to the correct Contabo storage URL
 * Handles both AWS S3 and Contabo formats, as well as relative paths
 * 
 * @param url The URL to convert (can be null or undefined)
 * @returns A properly formatted storage URL or a default image if the input is invalid
 */
export const convertStorageUrl = (url: string | null | undefined): string => {
  if (!url) return '/images/default-avatar.png';
  
  // If it's already a full URL (https://), return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If it's already a Contabo URL, return it as is
    if (url.includes(CONTABO_CONFIG.ENDPOINT)) {
      return url;
    }
    
    // If it's an S3 URL, convert it to Contabo format
    // Example: https://s3.amazonaws.com/bucket/path/to/file.jpg -> https://eu2.contabostorage.com/c7737d32901c47be91e8263ad074fd38/beldify1storage/path/to/file.jpg
    if (url.includes('s3.amazonaws.com')) {
      // Extract the path after the bucket name
      const pathMatch = url.match(/s3\.amazonaws\.com\/[^\/]+\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        return `${CONTABO_CONFIG.BASE_URL}/${pathMatch[1]}`;
      }
    }
    
    // If it's another type of URL, return it as is
    return url;
  }
  
  // If it's a relative path starting with '/', append it to the base URL
  if (url.startsWith('/')) {
    // Remove the leading slash to avoid double slashes
    const path = url.startsWith('/') ? url.substring(1) : url;
    return `${CONTABO_CONFIG.BASE_URL}/${path}`;
  }
  
  // Otherwise, assume it's a relative path and append it to the base URL
  return `${CONTABO_CONFIG.BASE_URL}/${url}`;
};
