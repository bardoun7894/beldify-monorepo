import api from '@/lib/api';
import logger from '@/utils/consoleLogger';
import { StockResponse } from '@/services/api/types';

export const cartService = {
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
      throw error;
    }
  },

  async checkStock(stockId: number, variantId?: number): Promise<StockResponse> {
    try {
      // Construct the URL based on whether a variant ID is provided
      const url = variantId
        ? `/api/stock/${stockId}/availability?variant_id=${variantId}`
        : `/api/stock/${stockId}/availability`;
      
      logger.log(`Checking stock at URL: ${url}`);
      const response = await api.get(url);
      
      // Log the response for debugging
      logger.log('Stock check response:', response.data);
      
      // Handle the new response format
      return {
        available_quantity: response.data.available_quantity,
        status: response.data.status,
        message: response.data.message,
        stock_id: response.data.stock_id,
        variant_id: response.data.variant_id,
        success: response.data.success
      };
    } catch (error: any) {
      logger.error('Error checking stock:', error);
      
      // If we get a 404 error, it means the stock doesn't exist
      // Return a structured response matching what the backend would send
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          available_quantity: 0,
          status: 'no_stock',
          message: 'Product does not exist',
          stock_id: stockId,
          variant_id: variantId
        };
      }
      
      throw error;
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
  }
};
