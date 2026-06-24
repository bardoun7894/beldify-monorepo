import axiosInstance from './axiosInstance';
import logger from '@/utils/consoleLogger';

export interface FeaturedProduct {
  id: number;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  price: string;
  original_price: string;
  discount_price: string | null;
  discount_percentage: number | null;
  has_discount: boolean;
  category: string;
  category_name: string | null;
  image: string | null;
  main_image: string | null;
  images: (string | null)[];
  is_custom: boolean;
  is_featured: boolean;
  is_trending: boolean;
  rating: number;
  review_count: number;
  in_stock: boolean;
  slug: string;
}

export interface MegaOfferCollection {
  id: number;
  title: string;
  description: string;
  banner_image: string;
  slug: string;
  start_date: string;
  end_date: string;
  color_theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  featured_products: FeaturedProduct[];
}

export const megaOfferService = {
  /**
   * Fetch active mega-offer collections from the backend.
   * Throws on network/HTTP errors — callers decide how to handle empty state.
   */
  getMegaOffers: async (): Promise<MegaOfferCollection[]> => {
    try {
      const response = await axiosInstance.get('/api/products/mega-offers');
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data as MegaOfferCollection[];
      }
      return [];
    } catch (error) {
      logger.error('Error fetching mega offers:', error);
      throw error;
    }
  },
};
