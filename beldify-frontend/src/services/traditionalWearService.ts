import axiosInstance from './axiosInstance';
import logger from '@/utils/consoleLogger';
import { Product } from '@/types/product';

// Define the actual API response structure based on the test results
interface ApiProductData {
  id: number;
  name: string;
  price: string;
  discount?: number;
  rating?: number;
  stock_status?: string;
  images?: string[];
  // Add other fields as needed based on the actual API response
}

export interface TraditionalWearResponse {
  success: boolean;
  data: ApiProductData[];
  message: string;
}

export const traditionalWearService = {
  /**
   * Get men's traditional wear products
   * @param locale Language code (en or ar)
   * @returns Promise with men's products
   */
  async getMensTraditionalWear(locale: string = 'en') {
    try {
      const response = await axiosInstance.get<TraditionalWearResponse>(`/api/products/mens`, {
        params: { locale }
      });
      
      if (response.data?.success) {
        // Map API response to Product type
        const products: Product[] = response.data.data.map(item => ({
          id: item.id,
          name: item.name,
          description: '',  // Default empty string if not provided
          price: parseFloat(item.price),
          images: item.images || [],
          category: 'mens_traditional',
          customizable: false,
          in_stock: item.stock_status === 'in_stock' || true,
          is_featured: false,
          rating: item.rating || 0,
          stock: 10, // Default value
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        return {
          data: products,
          error: null
        };
      }
      
      throw new Error('Invalid men\'s products response format');
    } catch (error) {
      logger.error('Error fetching men\'s traditional wear:', error);
      return {
        data: [],
        error: 'Failed to fetch men\'s traditional wear products'
      };
    }
  },

  /**
   * Get women's traditional wear products
   * @param locale Language code (en or ar)
   * @returns Promise with women's products
   */
  async getWomensTraditionalWear(locale: string = 'en') {
    try {
      const response = await axiosInstance.get<TraditionalWearResponse>(`/api/products/womens`, {
        params: { locale }
      });
      
      if (response.data?.success) {
        // Map API response to Product type
        const products: Product[] = response.data.data.map(item => ({
          id: item.id,
          name: item.name,
          description: '',  // Default empty string if not provided
          price: parseFloat(item.price),
          images: item.images || [],
          category: 'womens_traditional',
          customizable: false,
          in_stock: item.stock_status === 'in_stock' || true,
          is_featured: false,
          rating: item.rating || 0,
          stock: 10, // Default value
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        return {
          data: products,
          error: null
        };
      }
      
      throw new Error('Invalid women\'s products response format');
    } catch (error) {
      logger.error('Error fetching women\'s traditional wear:', error);
      return {
        data: [],
        error: 'Failed to fetch women\'s traditional wear products'
      };
    }
  },

  /**
   * Get children's traditional wear products
   * @param locale Language code (en or ar)
   * @returns Promise with children's products
   */
  async getChildrensTraditionalWear(locale: string = 'en') {
    try {
      const response = await axiosInstance.get<TraditionalWearResponse>(`/api/products/childrens`, {
        params: { locale }
      });
      
      if (response.data?.success) {
        // Map API response to Product type
        const products: Product[] = response.data.data.map(item => ({
          id: item.id,
          name: item.name,
          description: '',  // Default empty string if not provided
          price: parseFloat(item.price),
          images: item.images || [],
          category: 'childrens_traditional',
          customizable: false,
          in_stock: item.stock_status === 'in_stock' || true,
          is_featured: false,
          rating: item.rating || 0,
          stock: 10, // Default value
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        return {
          data: products,
          error: null
        };
      }
      
      throw new Error('Invalid children\'s products response format');
    } catch (error) {
      logger.error('Error fetching children\'s traditional wear:', error);
      return {
        data: [],
        error: 'Failed to fetch children\'s traditional wear products'
      };
    }
  }
};
