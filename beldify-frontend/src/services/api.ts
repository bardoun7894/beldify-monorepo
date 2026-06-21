import axios from 'axios';
import { isDebuggingEnabled } from '@/utils/debugMode';
import logger from '@/utils/consoleLogger';
import { StockResponse } from '@/services/api/types';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

api.interceptors.request.use(request => {
  // Only log in debug mode
  if (isDebuggingEnabled()) {
    logger.log('API Request:', {
      baseURL: request.baseURL,
      url: request.url,
      fullURL: `${request.baseURL}${request.url}`,
      method: request.method,
      data: request.data
    });
  }
  return request;
});

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

// Helper function for conditional logging
const debugLog = (message: string, data?: any) => {
  logger.log(message, data);
};

// Helper function for conditional error logging
const debugError = (message: string, error?: any) => {
  logger.error(message, error);
};

export const productService = {
  async getProduct(id: string | number) {
    try {
      const response = await api.get(`/products/${id}/details`); // Remove /api/
      return response.data;
    } catch (error) {
      debugError('API Error:', error);
      throw error;
    }
  },

  async getProducts(params?: Record<string, any>) {
    try {
      const response = await api.get('/products/all', { params }); // Remove /api/
      return response.data;
    } catch (error) {
      debugError('Error fetching products:', error);
      if (axios.isAxiosError(error) && error.response) {
        // Handle specific error cases
        if (error.response.status === 500) {
          throw new Error(
            'Internal server error occurred while fetching products. Please try again later.'
          );
        }
        // Handle other status codes as needed
        throw new Error(error.response.data?.message || 'Failed to fetch products');
      }
      throw error;
    }
  },

  async getRelatedProducts(productId: string, limit: number = 4) {
    try {
      const response = await api.get(`/products/${productId}/related`, { 
        params: { limit } 
      });
      return response.data;
    } catch (error) {
      debugError('Error fetching related products:', error);
      // Return empty array in case of error to prevent UI breaking
      return { products: [] };
    }
  },
  
  async getProductReviews(productId: string, page: number = 1, limit: number = 5, filters?: Record<string, any>) {
    try {
      const response = await api.get(`/products/${productId}/reviews`, {
        params: {
          page,
          limit,
          ...filters
        }
      });
      return response.data;
    } catch (error) {
      debugError('Error fetching product reviews:', error);
      throw error;
    }
  },
};


export const cartService = {
  async getCartRelatedProducts(productId?: string, limit: number = 8) {
    try {
      const params: Record<string, any> = { limit };
      if (productId) {
        params.product_id = productId;
      }
      const response = await api.get('/cart/related-products', { params });
      return response.data;
    } catch (error) {
      debugError('Error fetching cart related products:', error);
      // Return empty array in case of error to prevent UI breaking
      return { products: [] };
    }
  },

  async checkStock(stockId: number, variantId?: number): Promise<StockResponse> {
    if (!stockId) {
      debugError('Invalid stock ID provided:', stockId);
      throw new Error('Invalid stock ID');
    }

    try {
      // Construct the URL based on whether a variant ID is provided
      // Remove duplicate /api prefix since it's already in baseURL
      const url = variantId
        ? `/stock/${stockId}/availability?variant_id=${variantId}`
        : `/stock/${stockId}/availability`;
        
      debugLog('Checking stock availability:', { stockId, variantId, url });
      const response = await api.get(url);
      debugLog('Stock response:', response.data);
      
      // Ensure we have a consistent response format
      const stockResponse: StockResponse = {
        status: response.data.status,
        available_quantity: response.data.available_quantity,
        message: response.data.message,
        success: response.data.success,
        stock_id: response.data.stock_id,
        variant_id: response.data.variant_id
      };
      
      return stockResponse;
    } catch (error: any) {
      // If 404, treat as out of stock/no_stock
      if (error.response?.status === 404) {
        return {
          success: false,
          status: 'no_stock',
          available_quantity: 0,
          message: 'Product does not exist',
          stock_id: stockId,
          variant_id: variantId
        };
      }
      debugError('Error checking stock:', error);
      throw error;
    }
  },

  async getCart() {
    try {
      debugLog('Fetching cart...');
      // Check if token exists before making the API call
      const token = localStorage.getItem('token');
      if (!token) {
        debugLog('No authentication token found when fetching cart');
        return { status: 'error', message: 'Authentication required' };
      }

      const response = await api.get('/cart');
      debugLog('Cart API Response:', response.data);
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      };

      debugError('Cart API Error:', errorDetails);

      // For 500 errors, provide a more specific error message
      if (error.response?.status === 500) {
        debugError('Server error when fetching cart. This might be a temporary issue with the server.');
        return {
          status: 'error',
          message: 'The server encountered an error. Please try again later.',
          serverError: true
        };
      }

      // For 401 errors, handle authentication issues
      if (error.response?.status === 401) {
        debugError('Authentication error when fetching cart');
        localStorage.removeItem('token');
        return {
          status: 'error',
          message: 'Authentication failed. Please log in again.',
          authError: true
        };
      }

      throw error;
    }
  },

  async addItem(payload: { stock_id?: number; variant_id?: number; quantity: number }) {
    try {
      debugLog('Adding item to cart with payload:', payload);

      if (!payload.stock_id && !payload.variant_id) {
        throw new Error('Either stock_id or variant_id must be provided');
      }

      const response = await api.post('/cart/items', payload);
      debugLog('Add to cart response:', response.data);
      return response.data;
    } catch (error: any) {
      debugError('Error adding item to cart:', error);
      throw error;
    }
  },

  async updateQuantity(itemId: number, quantity: number) {
    try {
      debugLog('Updating cart item quantity:', { itemId, quantity });
      const response = await api.put(`/cart/items/${itemId}`, { quantity });
      debugLog('Update quantity response:', response.data);
      return response.data;
    } catch (error: any) {
      debugError('Error updating quantity:', error);
      throw error;
    }
  },

  async removeItem(itemId: number) {
    try {
      debugLog('Removing cart item:', itemId);
      const response = await api.delete(`/cart/items/${itemId}`);
      debugLog('Remove item response:', response.data);
      return response.data;
    } catch (error: any) {
      debugError('Remove Item Error:', error);
      throw error;
    }
  },

  // TODO: Backend route /cart/checkout does not exist yet
  async checkout(_data: {
    shipping_address: string;
    billing_address: string;
    payment_method: string;
  }) {
    throw new Error('Backend route /cart/checkout does not exist yet');
  },

  async applyCoupon(code: string) {
    try {
      const response = await api.post('/cart/apply-coupon', { code });
      return response.data;
    } catch (error: any) {
      debugError('Apply Coupon Error:', error);
      throw error;
    }
  },

  async removeCoupon() {
    try {
      const response = await api.post('/cart/remove-coupon');
      return response.data;
    } catch (error: any) {
      debugError('Remove Coupon Error:', error);
      throw error;
    }
  },

  async clearCart() {
    try {
      const response = await api.delete('/cart');
      return response.data;
    } catch (error: any) {
      debugError('Clear Cart Error:', error);
      throw error;
    }
  },
};

export const orderService = {
  async createOrder(orderData: any) {
    try {
      const response = await api.post('/orders', orderData); // No /api/
      return response.data;
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  },

  async getOrders() {
    try {
      const response = await api.get('/orders'); // No /api/
      return response.data;
    } catch (error) {
      logger.error('Error fetching orders:', error);
      throw error;
    }
  }
};

export const reviewService = {
  async createReview(reviewData: any) {
    try {
      const response = await api.post('/products/reviews', reviewData);
      return response.data;
    } catch (error) {
      debugError('Error creating review:', error);
      throw error;
    }
  },
  
  async updateReview(reviewId: string, reviewData: any) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      debugError('Error updating review:', error);
      throw error;
    }
  },
  
  async deleteReview(reviewId: string) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      debugError('Error deleting review:', error);
      throw error;
    }
  },
  
  async reactToReview(reviewId: string, reaction: 'like' | 'dislike' | null) {
    try {
      const response = await api.post(`/products/reviews/${reviewId}/reaction`, { reaction });
      return response.data;
    } catch (error) {
      debugError('Error reacting to review:', error);
      throw error;
    }
  },
  
  // TODO: Backend does not expose order-specific review endpoints. These need backend implementation.
  async getOrderReviewStatus(_orderId: string) {
    throw new Error('Order review status endpoint is not available on the backend.');
  },

  // TODO: Backend does not expose order-specific review endpoints. These need backend implementation.
  async submitOrderReview(_orderReviewData: any) {
    throw new Error('Order review submission endpoint is not available on the backend.');
  }
};

export default api;
