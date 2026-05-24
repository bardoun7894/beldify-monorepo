import axios from 'axios';
import { API_BASE_URL } from '@/config/constants';

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string;
  position: number;
  language?: string; // Optional property to specify banner language (ar, en, ma, etc.)
  text_position?: 'left' | 'right'; // Optional property to specify text position
}

export interface BannerResponse {
  status: string;
  data: Banner[];
}

// Fallback banner data in case the API fails
const fallbackBanners: Banner[] = [
  {
    id: 1,
    title: 'تجربة تسوق متكاملة',
    subtitle: 'اكتشف أحدث صيحات الموضة',
    button_text: 'تسوق الآن',
    button_link: '/products',
    image_url: '/images/hero-bg-1.jpg',
    position: 0,
    text_position: 'left'
  },
  {
    id: 2,
    title: 'خصومات هائلة',
    subtitle: 'وفر حتى 70% على المنتجات المختارة',
    button_text: 'استكشف العروض',
    button_link: '/products?sale=true',
    image_url: '/images/hero-bg-2.jpg',
    position: 1,
    text_position: 'right'
  }
];

export const bannerService = {
  /**
   * Get active hero banners
   * @returns Promise with banner data
   */
  getHeroBanners: async (): Promise<Banner[]> => {
    const maxRetries = 3;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use the API route that will be rewritten to the backend
        const response = await axios.get<BannerResponse>('/api/banners', {
          headers: {
            'Accept-Language': document.documentElement.lang || 'en',
            'Accept': 'application/json'
          },
          // Add timeout to prevent long waiting
          timeout: 15000
        });
      
      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        // Make sure image URLs are absolute
        return response.data.data.map(banner => ({
          ...banner,
          image_url: banner.image_url && banner.image_url.startsWith('http') 
            ? banner.image_url 
            : banner.image_url 
              ? `${API_BASE_URL}${banner.image_url}`
              : '/images/hero-bg-1.jpg' // Fallback image if image_url is empty
        }));
      }
      
      console.warn('Using fallback banner data due to invalid API response');
      return fallbackBanners;
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      // If this was the last attempt, return fallback data
      if (attempt === maxRetries) {
        console.warn('All retry attempts failed. Using fallback banner data');
        return fallbackBanners;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
    }
    
    // This should never be reached, but just in case
    return fallbackBanners;
  }
};
