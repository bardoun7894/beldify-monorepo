import axios from 'axios';
import { isDebuggingEnabled } from '@/utils/debugMode';
import logger from '@/utils/consoleLogger';

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
    let token: string | null = null;
    try { token = localStorage.getItem('token'); } catch { /* Safari ITP private-mode */ }
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
      // Only force a re-login when an actual auth session existed and is now
      // invalid. Guests (no token) legitimately get 401 from auth-only endpoints
      // on public pages (e.g. cart/related-products) — never hijack them to /login.
      let hadToken = false;
      try { hadToken = typeof window !== 'undefined' && !!localStorage.getItem('token'); } catch { /* Safari ITP */ }
      try { localStorage.removeItem('token'); } catch { /* Safari ITP */ }
      if (hadToken && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
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

interface StockResponse {
  available_quantity: number;
  status: string;
  message?: string;
  success?: boolean;
  stock_id?: number;
  variant_id?: number;
}

export const cartService = {
  // TODO: Backend route /cart/merge-guest does not exist yet
  async mergeGuestCart(): Promise<void> {
    debugLog('mergeGuestCart called but backend route /cart/merge-guest does not exist yet');
  },

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
        try { localStorage.removeItem('token'); } catch { /* Safari ITP */ }
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
  /**
   * Fetch approved product reviews from the real backend and normalize the
   * Laravel paginator + summary shape into the frontend ReviewsResponse.
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 5,
    filters?: Record<string, any>
  ) {
    const response = await api.get(`/products/${productId}/reviews`, {
      params: { page, per_page: limit, ...(filters || {}) },
    });

    const payload = response.data?.data ?? {};
    const paginator = payload.reviews ?? {};
    const rows: any[] = paginator.data ?? [];
    const summary = payload.summary ?? {};

    const reviews = rows.map((r) => ({
      id: String(r.id),
      productId: String(r.stock_id ?? productId),
      userId: String(r.user_id ?? ''),
      userName: r.user?.name || r.user?.display_name || 'Customer',
      userAvatar: r.user?.profile_image || undefined,
      rating: Number(r.rating) || 0,
      title: r.title || '',
      content: r.comment || '',
      images: Array.isArray(r.images) ? r.images : [],
      createdAt: r.created_at,
      verified: !!r.is_verified,
      likes: Number(r.likes) || 0,
      dislikes: Number(r.dislikes) || 0,
      userReaction: null,
    }));

    const dist = summary.rating_counts || {};
    return {
      reviews,
      summary: {
        averageRating: Number(summary.average_rating) || 0,
        totalReviews: Number(summary.total_reviews) || 0,
        ratingDistribution: {
          1: dist[1] ?? 0, 2: dist[2] ?? 0, 3: dist[3] ?? 0, 4: dist[4] ?? 0, 5: dist[5] ?? 0,
        },
        verifiedPurchases: reviews.filter((r) => r.verified).length,
        withImages: reviews.filter((r) => r.images.length > 0).length,
        withComments: reviews.filter((r) => r.content).length,
      },
      pagination: {
        currentPage: Number(paginator.current_page) || page,
        totalPages: Number(paginator.last_page) || 1,
        totalItems: Number(paginator.total) || reviews.length,
        hasMore: (Number(paginator.current_page) || 1) < (Number(paginator.last_page) || 1),
      },
    };
  },

  /**
   * Submit a review (multipart so receipt images upload as real files).
   * Backend stores it as status=pending until an admin approves it.
   */
  async createReview(productId: string, data: any, files?: File[]) {
    try {
      const form = new FormData();
      form.append('stock_id', String(productId));
      form.append('rating', String(data.rating));
      if (data.title) form.append('title', data.title);
      form.append('comment', data.content ?? data.comment ?? '');
      (files || []).forEach((f, i) => form.append(`images[${i}]`, f));

      const response = await api.post('/products/reviews', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
  
  /**
   * GET /api/orders/{orderId}/review-status (Bearer)
   * Returns { success, reviewable, items: [{ order_item_id, stock_id, name, reviewed, review_id }] }
   * Only reviewable for delivered/completed orders; 403 for non-owner.
   */
  async getOrderReviewStatus(orderId: string) {
    try {
      const response = await api.get(`/orders/${orderId}/review-status`);
      return response.data;
    } catch (error) {
      debugError('Error fetching order review status:', error);
      throw error;
    }
  },

  /**
   * POST /api/orders/{orderId}/reviews (Bearer)
   * Body: { items: [{ order_item_id, rating: 1-5, comment? }] }
   * Returns 201 { success, created }; 422 undelivered/validation, 409 duplicate item review.
   * Reviews enter moderation as status=pending, verified_purchase=true.
   */
  async submitOrderReview(orderId: string, items: Array<{ order_item_id: number; rating: number; comment?: string }>) {
    try {
      const response = await api.post(`/orders/${orderId}/reviews`, { items });
      return response.data;
    } catch (error) {
      debugError('Error submitting order review:', error);
      throw error;
    }
  }
};

export default api;
