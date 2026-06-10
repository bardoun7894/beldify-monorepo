import { Product } from '@/types/product'; // Import from the correct path
import { Category } from '@/types/category'; // Import Category type
import axios from 'axios';
import { ApiResponse } from './types';
import { Tailor } from '@/services/tailorService';
import logger from '@/utils/consoleLogger';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance without baseURL since we're using Next.js API rewrites
const api = axios.create({
  baseURL: API_URL, // Remove /api from here since it's already in the URL
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Helper functions to safely get tokens
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const getGuestToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guest_token');
  }
  return null;
};

const setGuestToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('guest_token', token);
    } else {
      localStorage.removeItem('guest_token');
    }
  }
};

// Add request interceptor for auth token and guest token
api.interceptors.request.use(
  async (config) => {
    // Only try to get tokens in browser environment
    const token = getAuthToken();
    const guestToken = getGuestToken();

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (guestToken && config.url?.includes('/api/cart')) {
      // Only add guest token for cart-related endpoints when not authenticated
      config.headers['X-Guest-Token'] = guestToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for auth errors and guest token handling
api.interceptors.response.use(
  (response) => {
    // Check for guest token in response headers
    const guestToken = response.headers?.['x-guest-token'];
    if (guestToken && !getAuthToken()) {
      setGuestToken(guestToken);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
    return Promise.reject(error);
  }
);

// Make sure all endpoints are consistent
export const fetchCategories = async () => {
  try {
    // Use the topCategories endpoint for homepage categories
    const response = await api.get('/api/categories/topCategories');
    return response.data.categories || [];
  } catch (error) {
      logger.error('Error fetching categories:', error);
    return [];
  }
};


// Tailors API
export const fetchTailors = async (): Promise<Tailor[]> => {
  try {
    const response = await api.get<ApiResponse<Tailor[]>>('/api/fetch-tailors'); // Add /api/
    return response.data?.data || [];
  } catch (error) {
    logger.error('Error fetching tailors:', error);
    return [];
  }
};
// Best Sellers API
export const fetchBestSellers = async (): Promise<Product[]> => {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      logger.error('API URL is not defined in environment variables');
      return [];
    }

    const response = await api.get<ApiResponse<any[]>>('/api/products/best-sellers');
    
    // Check if the response has the expected structure
    if (response.data?.success && Array.isArray(response.data.data)) {
      // Map the API response to the Product type from @/types/product
      const products: Product[] = response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        name_ar: item.name_ar || null,
        description: item.description || '',
        description_ar: item.description_ar || null,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
        original_price: item.original_price || 0,
        discount_price: item.discount_price || 0,
        has_discount: item.has_discount || false,
        images: item.images || [],
        main_image: item.main_image || null,
        category: item.category || '',
        category_ar: item.category_ar || null,
        customizable: item.customizable || false,
        in_stock: item.in_stock || false,
        is_featured: item.is_featured || false,
        rating: item.rating || 0,
        stock: item.stock || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return products;
    }
    
    // Fallback for old API format
    const dataAny = response.data as any;
    if (dataAny?.best_sellers && Array.isArray(dataAny.best_sellers)) {
      return dataAny.best_sellers;
    }
    
    logger.warn('Best sellers response format unexpected:', response.data);
    return [];
  } catch (error) {
    logger.error('Error fetching best sellers:', error);
    // Return empty array instead of throwing to prevent cascading errors
    return [];
  }
};

// Featured API
export const fetchFeatured = async (): Promise<Product[]> => {
  try {
    const response = await api.get<ApiResponse<Product[]>>('/api/fetch-featured'); // Add /api/
    return response.data?.data || [];
  } catch (error) {
    logger.error('Error fetching featured items:', error);
    return [];
  }
};

// New Arrivals API
export const fetchNewArrivals = async (): Promise<Product[]> => {
  try {
    // Call the backend API endpoint for new arrivals
    const response = await api.get<ApiResponse<any[]>>('/api/products/new-arrivals');
    logger.log('New Arrivals API Response:', response.data);

    // Check if the response has the expected structure
    if (response.data?.success && Array.isArray(response.data.data)) {
      // Map the API response to the Product type from @/types/product
      const products: Product[] = response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        name_ar: item.name_ar || null,
        description: item.description || '',
        description_ar: item.description_ar || null,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
        original_price: item.original_price || 0,
        discount_price: item.discount_price || 0,
        has_discount: item.has_discount || false,
        images: item.images || [],
        main_image: item.main_image || null,
        category: item.category || '',
        category_ar: item.category_ar || null,
        customizable: item.customizable || false,
        in_stock: item.in_stock || false,
        is_featured: item.is_featured || false,
        rating: item.rating || 0,
        stock: item.stock || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return products;
    }
    
    logger.warn('New arrivals response format unexpected:', response.data);
    return [];
  } catch (error) {
    logger.error('Error fetching new arrivals:', error);
    return [];
  }
};

// Special Offers API - Assuming SpecialOffer is similar to Product for now
export const fetchSpecialOffers = async (): Promise<Product[]> => {
  try {
    // Use Product type, adjust endpoint if needed
    const response = await api.get<{ special_offers: Product[] }>("/api/fetch-special-offers");
    return response.data?.special_offers || [];
  } catch (error) {
    logger.error("Error fetching special offers:", error);
    return [];
  }
};

// Mega Product Offers API
export const fetchMegaOffers = async (): Promise<Product[]> => {
  try {
    // Call the backend API endpoint for mega offers
    const response = await api.get<ApiResponse<any[]>>('/api/products/mega-offers');
    logger.log('Mega Offers API Response:', response.data);

    // Check if the response has the expected structure
    if (response.data?.success && Array.isArray(response.data.data)) {
      // Map the API response to the Product type
      const products: Product[] = response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        name_ar: item.name_ar || null,
        description: item.description || '',
        description_ar: item.description_ar || null,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
        original_price: item.original_price || 0,
        discount_price: item.discount_price || 0,
        has_discount: item.has_discount || false,
        images: item.images || [],
        main_image: item.main_image || null,
        category: item.category || '',
        category_ar: item.category_ar || null,
        customizable: item.customizable || false,
        in_stock: item.in_stock || false,
        is_featured: item.is_featured || false,
        rating: item.rating || 0,
        stock: item.stock || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return products;
    }
    
    logger.warn('Mega offers response format unexpected:', response.data);
    return [];
  } catch (error) {
    logger.error('Error fetching mega offers:', error);
    return [];
  }
};

// Men's Products API
export const fetchMensProducts = async (): Promise<Product[]> => {
  try {
    // Call the backend API endpoint for men's products
    const response = await api.get<ApiResponse<any[]>>('/api/products/mens');
    logger.log('Men\'s Products API Response:', response.data);

    // Check if the response has the expected structure
    if (response.data?.success && Array.isArray(response.data.data)) {
      // Map the API response to the Product type from @/types/product
      const products: Product[] = response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        name_ar: item.name_ar || null,
        description: item.description || '',
        description_ar: item.description_ar || null,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
        original_price: item.original_price || 0,
        discount_price: item.discount_price || 0,
        has_discount: item.has_discount || false,
        images: item.images || [],
        main_image: item.main_image || null,
        category: item.category || '',
        category_ar: item.category_ar || null,
        customizable: item.customizable || false,
        in_stock: item.in_stock || false,
        is_featured: item.is_featured || false,
        rating: item.rating || 0,
        stock: item.stock || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return products;
    }
    
    logger.warn('Men\'s products response format unexpected:', response.data);
    return [];
  } catch (error) {
    logger.error('Error fetching men\'s products:', error);
    return [];
  }
};

// Women's Products API
export const fetchWomensProducts = async (): Promise<Product[]> => {
  try {
    // Call the backend API endpoint for women's products
    const response = await api.get<ApiResponse<any[]>>('/api/products/womens');
    logger.log('Women\'s Products API Response:', response.data);

    // Check if the response has the expected structure
    if (response.data?.success && Array.isArray(response.data.data)) {
      // Map the API response to the Product type from @/types/product
      const products: Product[] = response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        name_ar: item.name_ar || null,
        description: item.description || '',
        description_ar: item.description_ar || null,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
        original_price: item.original_price || 0,
        discount_price: item.discount_price || 0,
        has_discount: item.has_discount || false,
        images: item.images || [],
        main_image: item.main_image || null,
        category: item.category || '',
        category_ar: item.category_ar || null,
        customizable: item.customizable || false,
        in_stock: item.in_stock || false,
        is_featured: item.is_featured || false,
        rating: item.rating || 0,
        stock: item.stock || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return products;
    }
    
    logger.warn('Women\'s products response format unexpected:', response.data);
    return [];
  } catch (error) {
    logger.error('Error fetching women\'s products:', error);
    return [];
  }
};

// Children's Products API
export const fetchChildrensProducts = async (): Promise<Product[]> => {
  try {
    // Call the backend API endpoint for children's products
    const response = await api.get<ApiResponse<any[]>>('/api/products/childrens');
    logger.log('Children\'s Products API Response:', response.data);

    // Check if the response has the expected structure
    if (response.data?.success && Array.isArray(response.data.data)) {
      // Map the API response to the Product type from @/types/product
      const products: Product[] = response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        name_ar: item.name_ar || null,
        description: item.description || '',
        description_ar: item.description_ar || null,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
        original_price: item.original_price || 0,
        discount_price: item.discount_price || 0,
        has_discount: item.has_discount || false,
        images: item.images || [],
        main_image: item.main_image || null,
        category: item.category || '',
        category_ar: item.category_ar || null,
        customizable: item.customizable || false,
        in_stock: item.in_stock || false,
        is_featured: item.is_featured || false,
        rating: item.rating || 0,
        stock: item.stock || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return products;
    }
    
    logger.warn('Children\'s products response format unexpected:', response.data);
    return [];
  } catch (error) {
    logger.error('Error fetching children\'s products:', error);
    return [];
  }
};

// Category Details API
export const fetchCategoryDetails = async (
  slug: string
): Promise<{ category: Category; products: Product[] }> => {
  try {
    const response = await api.get(`/api/categories/${slug}`);
    // Use response.data directly with Axios
    const data = response.data;

    // Check status code for success (e.g., 200)
    if (response.status !== 200) {
      throw new Error(data.error || `Failed to load category: ${response.status}`);
    }

    // Assuming the API returns the structure { category: Category, products: Product[] }
    // Adjust if the actual structure is different (e.g., under a 'data' key)
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to load category details');
  }
};

export const fetchProducts = async () => {
  try {
    const response = await api.get('/api/products/all'); // Add /api/
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching products:', error);
    throw error;
  }
};

export default api;
