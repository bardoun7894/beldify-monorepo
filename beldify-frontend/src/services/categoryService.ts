import axiosInstance from './axiosInstance';
import { Category, CategoriesResponse } from '../types/category';
import logger from '@/utils/consoleLogger';

export const categoryService = {
  // Updated to accept optional gender filter
  getAllCategories: async (gender?: string): Promise<Category[]> => {
    try {
      let url = '/api/categories/getAllCategories';
      // Append gender query parameter if provided and not 'All'
      if (gender && gender !== 'All') {
        url += `?gender=${encodeURIComponent(gender)}`;
      }
      const response = await axiosInstance.get<CategoriesResponse>(url);
      if (response.data?.categories) {
        // Pass through original name fields, let component decide language
        return response.data.categories.map(cat => ({
          ...cat,
          // Correctly map from API fields (name_en, name_ar, itemCount) to type fields
          name_en: cat.name_en || '', // Directly use cat.name_en from API response
          name_ar: cat.name_ar || '', // Directly use cat.name_ar from API response
          slug: cat.slug || `category-${cat.id}`, // Ensure slug exists
          itemCount: cat.itemCount || 0 // Directly use cat.itemCount from API response
        }));
      }
      throw new Error('Invalid categories response format');
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw error;
    }
  },

  getCategoryDetails: async (slug: string): Promise<Category> => {
    try {
      const response = await axiosInstance.get(`/api/categories/${slug}`);
      if (response.data?.category) {
        return {
          ...response.data.category,
          name: response.data.category.category_name_en
        };
      }
      throw new Error('Invalid category details response format');
    } catch (error) {
      logger.error(`Error fetching category ${slug}:`, error);
      throw error;
    }
  }
};
