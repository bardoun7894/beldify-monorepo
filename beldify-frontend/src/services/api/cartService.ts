import api from '@/lib/api';
import logger from '@/utils/consoleLogger';
import { CartService, CartServiceResponse, StockResponse } from './types';

export const cartService: CartService = {
  // TODO: Backend route /cart/merge-guest does not exist yet
  async mergeGuestCart(): Promise<CartServiceResponse> {
    logger.warn('mergeGuestCart called but backend route /cart/merge-guest does not exist yet');
    return { status: 'success' } as CartServiceResponse;
  },
  async getCart() {
    try {
      logger.log('Fetching cart...');
      const response = await api.get('/api/cart');
      logger.log('Cart API Response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Cart API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      
      // Handle 500 error specifically first
      if (error.response?.status === 500) {
        logger.warn('Cart API returned 500, likely empty cart. Returning empty object.');
        return {}; // Return an empty object to represent an empty/non-existent cart
      } else {
        throw error;
      }
    }
  },

  async addItem(payload: { stock_id?: number; variant_id?: number; quantity: number }) {
    try {
      logger.log('Adding item to cart with payload:', payload);

      if (!payload.stock_id && !payload.variant_id) {
        throw new Error('Either stock_id or variant_id must be provided');
      }

      const response = await api.post('/api/cart/items', payload);
      logger.log('Add to cart response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error adding item to cart:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async updateQuantity(itemId: number, quantity: number): Promise<CartServiceResponse> {
    try {
      logger.log('Updating cart item quantity:', { itemId, quantity });
      const response = await api.put(`/api/cart/items/${itemId}`, { quantity });
      logger.log('Update quantity response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating cart item quantity:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async removeItem(itemId: number): Promise<CartServiceResponse> {
    try {
      logger.log('Removing item from cart:', itemId);
      const response = await api.delete(`/api/cart/items/${itemId}`);
      logger.log('Remove item response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error removing item from cart:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async applyCoupon(code: string): Promise<CartServiceResponse> {
    try {
      logger.log('Applying coupon:', code);
      const response = await api.post('/api/cart/apply-coupon', { code });
      logger.log('Apply coupon response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error applying coupon:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async removeCoupon(): Promise<CartServiceResponse> {
    try {
      logger.log('Removing coupon from cart');
      const response = await api.post('/api/cart/remove-coupon');
      logger.log('Remove coupon response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error removing coupon:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async clearCart(): Promise<CartServiceResponse> {
    try {
      logger.log('Clearing cart');
      const response = await api.delete('/api/cart');
      logger.log('Clear cart response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error clearing cart:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async checkStock(stockId: number, variantId?: number): Promise<StockResponse> {
    try {
      // Construct the URL based on whether a variant ID is provided
      const url = variantId
        ? `/api/stock/${stockId}/availability?variant_id=${variantId}`
        : `/api/stock/${stockId}/availability`;
        
      logger.log('Checking stock availability:', { stockId, variantId, url });
      const response = await api.get(url);
      logger.log('Stock check response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error checking stock:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async getCartRelatedProducts(productId?: string, limit?: number): Promise<any> {
    try {
      logger.log('Fetching cart related products:', { productId, limit });
      const params = new URLSearchParams();
      if (productId) params.append('product_id', productId);
      if (limit) params.append('limit', limit.toString());
      
      const url = `/api/cart/related-products${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      logger.log('Cart related products response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching cart related products:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  }
};
