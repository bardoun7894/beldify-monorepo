import { CONTABO_CONFIG } from '@/config/constants';

// Default placeholder image path used throughout the application
export const DEFAULT_PLACEHOLDER_IMAGE = '/placeholder-product.svg';

/**
 * Replaces an image element with an SVG placeholder when the image fails to load
 * @param event - The error event from the image
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const imgElement = event.target as HTMLImageElement;
  const container = imgElement.parentElement;

  if (container) {
    // Create SVG placeholder
    const svg = document.createElement('div');
    svg.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" fill="#f3f4f6" />
        <path d="M19.5 4h-15A2.5 2.5 0 002 6.5v11A2.5 2.5 0 004.5 20h15a2.5 2.5 0 002.5-2.5v-11A2.5 2.5 0 0019.5 4zm1.5 13.5c0 .827-.673 1.5-1.5 1.5h-15c-.827 0-1.5-.673-1.5-1.5v-11C3 5.673 3.673 5 4.5 5h15c.827 0 1.5.673 1.5 1.5v11z" fill="#9ca3af" />
        <path d="M6.5 7C5.673 7 5 7.673 5 8.5S5.673 10 6.5 10 8 9.327 8 8.5 7.327 7 6.5 7zm0 2a.5.5 0 110-1 .5.5 0 010 1zm8.998 2.022l-3.792 4.488L9.498 13l-3.792 4.488c-.339.4-.288.999.112 1.337.4.339.999.288 1.337-.112l2.934-3.473 2.208 2.51c.339.4.938.451 1.337.112l4.63-5.488c.339-.4.288-.999-.112-1.337-.4-.339-.999-.288-1.337.112l-.817.967z" fill="#9ca3af" />
      </svg>
    `;

    // Replace the image with the SVG
    container.innerHTML = '';
    container.appendChild(svg.firstChild as Node);
    container.classList.add('bg-gray-100');
  }
};

/**
 * Utility function to get the full URL for an image
 * @param path - The relative path or full URL of the image
 * @param defaultImage - Optional default image path to use if path is not provided
 */
export const getImageUrl = (
  path?: string | null,
  defaultImage: string = DEFAULT_PLACEHOLDER_IMAGE
): string => {
  if (!path) {
    return defaultImage;
  }

  // If the path is already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a local path starting with '/', it's a local image
  if (path.startsWith('/')) {
    return path;
  }

  // Handle relative paths from API responses (like 'stocks/stock_1_jabador.jpg')
  // These should be treated as Contabo storage paths
  
  // If path starts with a slash, remove it
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Fix duplicate segments in path if needed
  const fixedPath = cleanPath;
  
  // Return full Contabo URL using the configuration
  return `${CONTABO_CONFIG.BASE_URL}/${fixedPath}`;
};
