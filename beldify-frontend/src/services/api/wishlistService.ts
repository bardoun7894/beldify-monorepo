import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

export const wishlistService = {
  async getWishlist() {
    try {
      const response = await api.get('/wishlist');
      return response.data;
    } catch (error: any) {
      logger.error('Wishlist API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  async addItem(productId: number) {
    try {
      const response = await api.post('/wishlist', { product_id: productId });
      return response.data;
    } catch (error: any) {
      logger.error('Error adding item to wishlist:', error);
      throw error;
    }
  },

  async removeItem(productId: number) {
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error removing item from wishlist:', error);
      throw error;
    }
  }
};
