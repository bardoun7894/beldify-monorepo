import axiosInstance from './axiosInstance';
import { Shop } from '@/lib/types/shop';
import logger from '@/utils/consoleLogger';

export interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiError {
  message: string;
}

export interface ShopResponse {
  status: string;
  data: {
    shops: Shop[];
    pagination: PaginationData;
  };
}

interface ApiResponse {
  store: {
    id: number;
    name: string;
    slug: string | null;
    description: string;
    logo: string;
    cover_image: string;
    location: string;
    location_ar: string;
    rating: number;
    total_reviews: number;
    is_verified: boolean;
    business_hours: string[];
    shipping_methods: any[];
    payment_methods: any[];
    return_policy: string;
    shipping_policy: string;
    products: any[];
    categories: any[];
    meta: {
      data_source: string;
      version: string;
      migration_phase: number;
    };
  };
}

export const shopService = {
  // Get all shops with pagination and filters
  async getShops(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    type?: string;
    sort?: 'name_asc' | 'name_desc' | 'products_count' | 'latest';
    locale?: string;
  }) {
    try {
      const response = await axiosInstance.get('/api/shops', { params });
      // Transform API response to match expected structure
      return {
        data: {
          shops: response.data.data,
          pagination: {
            current_page: response.data.meta.current_page,
            last_page: response.data.meta.last_page,
            per_page: response.data.meta.per_page,
            total: response.data.meta.total
          }
        },
        error: null,
      };
    } catch (error: any) {
      logger.error('Error fetching shops:', error);
      return {
        data: null,
        error: { message: error.response?.data?.message || error.message || 'Error fetching shops' },
      };
    }
  },

  // Get a single shop by name
  async getShopByName(name: string) {
    try {
      const response = await axiosInstance.get<ApiResponse>(`/api/shops/${name}`);
      return {
        data: response.data,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error fetching shop:', error);
      return {
        data: null,
        error: { message: error.response?.data?.message || error.message || 'Error fetching shop' },
      };
    }
  },

  // Get shop products with pagination
  async getShopProducts(
    shopId: string | number,
    params?: {
      page?: number;
      per_page?: number;
      category?: string;
      search?: string;
      sort?: string;
      locale?: string;
    }
  ) {
    try {
      const response = await axiosInstance.get(`/api/shops/${shopId}/products`, { params });
      return {
        data: response.data.data,
        error: null,
      };
    } catch (error: any) {
      logger.error('Error fetching shop products:', error);
      return {
        data: null,
        error: { message: error.response?.data?.message || error.message || 'Error fetching shop products' },
      };
    }
  },

  // Follow a shop
  async followShop(shopId: string | number): Promise<{
    data?: any;
    isAuthenticated?: boolean;
    error?: string | null;
  }> {
    try {
      // Add cache buster to prevent stale responses
      const cacheBuster = `_t=${Date.now()}`;
      const response = await axiosInstance.post(`/api/shops/${shopId}/follow?${cacheBuster}`);
      
      // Log the response for debugging
      logger.log('Follow shop response:', response.data);
      
      // Store follow status in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`shop_${shopId}_following`, 'true');
        logger.log(`Updated session storage: shop_${shopId}_following = true`);
      }
      
      return {
        data: response.data,
        isAuthenticated: true,
        error: null
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Authentication error
        logger.error('Authentication error when following shop:', error.response?.data);
        return { isAuthenticated: false, error: 'Authentication required' };
      }
      
      logger.error('Error following shop:', error);
      return { 
        isAuthenticated: true,
        error: error.message || 'Error following shop' 
      };
    }
  },
  
  // Unfollow a shop
  async unfollowShop(shopId: string | number): Promise<{
    data?: any;
    isAuthenticated?: boolean;
    error?: string | null;
  }> {
    try {
      // Add cache buster to prevent stale responses
      const cacheBuster = `_t=${Date.now()}`;
      const response = await axiosInstance.delete(`/api/shops/${shopId}/follow?${cacheBuster}`);
      
      // Log the response for debugging
      logger.log('Unfollow shop response:', JSON.stringify(response.data));
      
      // Update session storage after successful unfollow
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`shop_${shopId}_following`, 'false');
        logger.log(`Updated session storage after unfollow: shop_${shopId}_following = false`);
      }
      
      return {
        data: { success: true, message: 'Successfully unfollowed shop' },
        error: null,
        isAuthenticated: true
      };
    } catch (error: any) {
      // Handle 401 Unauthorized error gracefully
      if (error.response?.status === 401) {
        logger.log('User not authenticated for unfollow action');
        return {
          data: null,
          error: null,
          isAuthenticated: false
        };
      }
      
      logger.error('Error unfollowing shop:', error);
      return {
        data: null,
        error: String(error.response?.data?.message || error.message || 'Error unfollowing shop'),
        isAuthenticated: true
      };
    }
  },

  // Check if user follows a shop
  async checkFollowing(shopId: string | number): Promise<{
    data?: { isFollowing: boolean };
    error: string | null;
    isAuthenticated: boolean;
  }> {
    try {
      // Add cache buster to prevent stale responses
      const cacheBuster = `_t=${Date.now()}`;
      const response = await axiosInstance.get(`/api/shops/${shopId}/following?${cacheBuster}`);
      
      // Log the raw response for debugging
      logger.log('Raw follow check response:', response.data);
      
      // Handle nested data structure: { status: 'success', data: { isFollowing: bool } }
      if (response.data?.status === 'success' && response.data?.data) {
        // Store in session storage for persistence
        if (typeof window !== 'undefined') {
          const storeKey = `shop_${shopId}_following`;
          sessionStorage.setItem(storeKey, response.data.data.isFollowing ? 'true' : 'false');
        }
        
        return {
          data: response.data.data,
          isAuthenticated: response.data.data.isAuthenticated !== false,
          error: null
        };
      }
      
      // Handle flat structure: { isFollowing: bool }
      if (typeof response.data?.isFollowing === 'boolean') {
        // Store in session storage for persistence
        if (typeof window !== 'undefined') {
          const storeKey = `shop_${shopId}_following`;
          sessionStorage.setItem(storeKey, response.data.isFollowing ? 'true' : 'false');
        }
        
        return {
          data: { isFollowing: response.data.isFollowing },
          isAuthenticated: true,
          error: null
        };
      }
      
      // Fallback to session storage if response format is unexpected
      if (typeof window !== 'undefined') {
        const storeKey = `shop_${shopId}_following`;
        const storedStatus = sessionStorage.getItem(storeKey);
        if (storedStatus) {
          logger.log(`Using cached follow status from session storage: ${storedStatus}`);
          return {
            data: { isFollowing: storedStatus === 'true' },
            isAuthenticated: true,
            error: null
          };
        }
      }
      
      // Default response if all else fails
      return {
        data: { isFollowing: false },
        isAuthenticated: true,
        error: null
      };
    } catch (error: any) {
      logger.error('Error checking following status:', error);
      
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        logger.log('Authentication error (401) when checking follow status');
        
        // Try to get from session storage as fallback for UI state
        if (typeof window !== 'undefined') {
          const storeKey = `shop_${shopId}_following`;
          const storedStatus = sessionStorage.getItem(storeKey);
          if (storedStatus) {
            logger.log(`Using cached follow status despite auth error: ${storedStatus}`);
            // Return the cached status but indicate auth issue
            return {
              data: { isFollowing: storedStatus === 'true' },
              isAuthenticated: false, // Still indicate auth issue
              error: 'Authentication required'
            };
          }
        }
        
        return {
          data: { isFollowing: false },
          isAuthenticated: false,
          error: 'Authentication required'
        };
      }
      
      // Try to get from session storage as fallback
      if (typeof window !== 'undefined') {
        const storeKey = `shop_${shopId}_following`;
        const storedStatus = sessionStorage.getItem(storeKey);
        if (storedStatus) {
          logger.log(`Using cached follow status after error: ${storedStatus}`);
          return {
            data: { isFollowing: storedStatus === 'true' },
            isAuthenticated: true,
            error: null
          };
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Error checking following status';
      return {
        data: { isFollowing: false },
        isAuthenticated: true,
        error: errorMessage
      };
    }
  },
};
