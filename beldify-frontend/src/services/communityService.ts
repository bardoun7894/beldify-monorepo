import axios from 'axios';
import { CommunityPost, CommunityResponse, CommunityPostFormData, CommunityResponseFormData, Shop, Message, SellerCommunityStats, JobFilters, JobSort } from '@/types/community';
import { getMockShop, getMockMessages, addMockMessage } from '@/mocks/mockMessagingData';
import logger from '@/utils/consoleLogger'; 

import { API_BASE_URL } from '@/config/constants';

// Use the correct backend API URLs
const LOCAL_API_BASE = '/api';
const API_V1_URL = '/api/v1'; // Use the v1 API endpoint prefix

// Response interfaces for API responses
interface PaginatedPosts {
  data: CommunityPost[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

interface SinglePostResponse {
  data: CommunityPost;
}

interface PostCreationResponse {
  message: string;
  data: CommunityPost;
}

interface PaginatedResponses {
  data: CommunityResponse[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

interface ResponseCreationResponse {
  message: string;
  data: CommunityResponse;
}

// Helper to get the authorization token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Check for token in the same key used by AuthContext.tsx
    return localStorage.getItem('token');
  }
  return null;
};

// Function to get CSRF token
const getCsrfToken = async () => {
  try {
    // Use API_BASE_URL, not API_V1_URL for CSRF cookies
    const response = await axios.get(`${API_BASE_URL}/csrf-cookie`, { withCredentials: true });
    logger.log('CSRF token response:', response.data);
    return true;
  } catch (error) {
    logger.error('Failed to fetch CSRF token:', error);
    // Continue even if CSRF fails - we don't want to block the entire application
    return false;
  }
};

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_V1_URL, // Use the v1 API endpoint
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for CSRF and auth cookies
});

// Add request interceptor for auth and CSRF
axiosInstance.interceptors.request.use(
  async config => {
    // For state-changing requests (POST, PUT, DELETE, PATCH), ensure CSRF token
    const isStateChangingRequest = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '');
    
    if (isStateChangingRequest) {
      // Get CSRF token before sending the request
      await getCsrfToken();
      
      // Add the XSRF-TOKEN from cookies to the request headers
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='));
        
      if (token) {
        const csrfToken = decodeURIComponent(token.split('=')[1]);
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }
    
    // Add auth token if available
    const authToken = getAuthToken();
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Handle errors (e.g., auth errors, CORS issues)
    if (axios.isAxiosError(error)) {
      logger.error('API Error Details:', error.response?.data || error.message);
      
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        // Redirect to login if needed
        if (typeof window !== 'undefined') {
          // Check if we're not already on the login page to avoid redirect loops
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login')) {
            // Store the current path for redirect after login
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      }
      
      // Handle 419 CSRF token mismatch
      if (error.response?.status === 419) {
        logger.error('CSRF token mismatch. Refreshing token...');
        // You could attempt to refresh the token and retry the request here
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch community posts (Open Souk jobs) with pagination and filters.
 *
 * Supports both the legacy filter keys (category_id, status, color, style,
 * search) and the new Open Souk keys (budget_min, budget_max, skills, q,
 * sort, limit) so existing call-sites continue to work unchanged.
 */
export const fetchCommunityPosts = async (
  filters: JobFilters & {
    color?: string;
    style?: string;
    /** @deprecated Use `q` instead */
    search?: string;
  },
  page: number = 1,
  per_page: number = 12,
  sort?: JobSort,
  limit?: number
): Promise<PaginatedPosts> => {
  const params = new URLSearchParams();

  // Pagination
  params.append('page', page.toString());
  params.append('per_page', per_page.toString());

  // Legacy filters (backward-compat)
  if (filters.category_id) params.append('category_id', filters.category_id);
  if (filters.status) params.append('status', filters.status);
  if (filters.color) params.append('color', filters.color ?? '');
  if (filters.style) params.append('style', filters.style ?? '');

  // Search: `q` takes precedence; fall back to `search` for old call-sites
  const searchQuery = filters.q ?? filters.search;
  if (searchQuery) params.append('q', searchQuery);

  // New Open Souk filters
  if (filters.budget_min != null) params.append('budget_min', String(filters.budget_min));
  if (filters.budget_max != null) params.append('budget_max', String(filters.budget_max));
  if (filters.skills && filters.skills.length > 0) {
    filters.skills.forEach(skill => params.append('skills[]', skill));
  }

  // Sort and limit
  const resolvedSort = sort ?? (filters as any).sort;
  if (resolvedSort) params.append('sort', resolvedSort);
  if (limit != null) params.append('limit', String(limit));

  return axiosInstance.get<PaginatedPosts>(`/community/posts?${params.toString()}`)
    .then(response => response.data)
    .catch(error => {
      logger.error('Error fetching community posts:', error);
      throw error;
    });
};

/**
 * Fetch a single community post by ID
 */
export const fetchCommunityPost = async (id: string): Promise<CommunityPost> => {
  return axiosInstance.get<SinglePostResponse>(`/community/posts/${id}`)
    .then(response => response.data.data)
    .catch(error => {
      logger.error(`Error fetching community post ${id}:`, error);
      throw error;
    });
};

/**
 * Create a new community post
 */
export const createCommunityPost = async (formData: FormData): Promise<CommunityPost> => {
  return axiosInstance.post<PostCreationResponse>('/community/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
    .then(response => response.data.data)
    .catch(error => {
      logger.error('Error creating community post:', error);
      throw error;
    });
};

/**
 * Update an existing community post
 */
export const updateCommunityPost = async (id: string, formData: FormData): Promise<CommunityPost> => {
  // We need to append the _method field for the backend to recognize it as a PUT request
  // when sent with multipart/form-data
  formData.append('_method', 'PUT');
  
  return axiosInstance.post<PostCreationResponse>(`/community/posts/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
    .then(response => response.data.data)
    .catch(error => {
      logger.error(`Error updating community post ${id}:`, error);
      throw error;
    });
};

/**
 * Delete a community post
 */
export const deleteCommunityPost = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/community/posts/${id}`);
  } catch (error) {
    logger.error(`Error deleting community post ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch responses for a specific post
 */
export const fetchPostResponses = async (postId: string): Promise<CommunityResponse[]> => {
  try {
    const response = await axiosInstance.get<PaginatedResponses>(`/community/posts/${postId}/responses`);
    return response.data.data;
  } catch (error) {
    logger.error(`Error fetching responses for post ${postId}:`, error);
    throw error;
  }
};

/**
 * Create a new response (proposal) for a post.
 *
 * Accepts either a pre-built FormData or a plain options object. When an
 * options object is supplied, `delivery_days` is appended to the FormData
 * sent to the backend (POST /api/v1/seller/community/posts/{post}/respond).
 */
export const createCommunityResponse = async (
  postId: string,
  formDataOrOptions:
    | FormData
    | { formData: FormData; delivery_days?: number }
): Promise<CommunityResponse> => {
  let fd: FormData;

  if (formDataOrOptions instanceof FormData) {
    fd = formDataOrOptions;
  } else {
    fd = formDataOrOptions.formData;
    if (formDataOrOptions.delivery_days != null) {
      fd.append('delivery_days', String(formDataOrOptions.delivery_days));
    }
  }

  return axiosInstance.post<ResponseCreationResponse>(`/seller/community/posts/${postId}/respond`, fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
    .then(response => response.data.data)
    .catch(error => {
      logger.error(`Error creating response for post ${postId}:`, error);
      throw error;
    });
};

/**
 * Update a response's status (accept/reject)
 * Backend endpoints:
 *   POST /api/v1/community/posts/{post}/responses/{response}/accept
 *   POST /api/v1/community/posts/{post}/responses/{response}/reject
 */
export const updateResponseStatus = async (postId: string, responseId: string, status: 'accepted' | 'rejected'): Promise<CommunityResponse> => {
  try {
    const action = status === 'accepted' ? 'accept' : 'reject';
    const response = await axiosInstance.post<ResponseCreationResponse>(
      `/community/posts/${postId}/responses/${responseId}/${action}`
    );
    return response.data.data;
  } catch (error) {
    logger.error(`Error updating response ${responseId} status:`, error);
    throw error;
  }
};

/**
 * Update an existing response
 * NOTE: The backend does not currently have a generic update endpoint for responses.
 * Seller responses are created via POST /api/v1/seller/community/posts/{post}/respond.
 * This function is a placeholder for future backend support.
 */
export const updateCommunityResponse = async (postId: string, responseId: string, formData: FormData): Promise<CommunityResponse> => {
  try {
    // Backend does not have a direct update endpoint for responses.
    // For now, log a warning and throw an informative error.
    logger.warn(`updateCommunityResponse called for response ${responseId} on post ${postId}, but no backend endpoint exists for this operation.`);
    throw new Error('Updating responses is not currently supported by the backend API.');
  } catch (error) {
    logger.error(`Error updating response ${responseId}:`, error);
    throw error;
  }
};

/**
 * Delete a response
 * NOTE: The backend does not currently have a delete endpoint for responses.
 * This function is a placeholder for future backend support.
 */
export const deleteCommunityResponse = async (_responseId: string): Promise<void> => {
  try {
    logger.warn(`deleteCommunityResponse called for response ${_responseId}, but no backend endpoint exists for this operation.`);
    throw new Error('Deleting responses is not currently supported by the backend API.');
  } catch (error) {
    logger.error(`Error deleting community response ${_responseId}:`, error);
    throw error;
  }
};

/**
 * Redirect sellers to the backend interface for responding to posts
 */
export const redirectToSellerResponse = (postId: string, language: string = 'en'): void => {
  if (typeof window !== 'undefined') {
    const url = `${API_BASE_URL}/${language}/seller/community/posts/${postId}/respond`;
    window.location.href = url;
  }
};

/**
 * Fetch shop details by ID
 */
export const fetchShopDetails = async (shopId: string): Promise<Shop> => {
  try {
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      logger.log('Using mock shop data for development');
      const mockShop = getMockShop(shopId);
      if (mockShop) {
        return mockShop;
      }
      throw new Error('Shop not found');
    }
    
    // In production, use the API
    const response = await axios.get(`/api/shops/${shopId}`);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching shop details:', error);
    throw error;
  }
};

/**
 * Send a message to a seller
 * @param recipientId ID of the recipient (shop owner/seller)
 * @param content Message content
 * @param postId Optional post ID if the message is related to a post
 * @param attachments Optional file attachments
 */
export const sendMessage = async (
  recipientId: string, 
  content: string, 
  postId?: string, 
  attachments: File[] = []
): Promise<Message> => {
  try {
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      logger.log('Using mock messaging data for development');
      return addMockMessage(recipientId, content, postId);
    }
    
    // In production, use the API
    const formData = new FormData();
    formData.append('recipient_id', recipientId);
    formData.append('content', content);
    
    if (postId) {
      formData.append('post_id', postId);
    }
    
    // Add attachments if any
    attachments.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file);
    });
    
    const authToken = getAuthToken();
    const response = await axios.post(`${API_BASE_URL}/api/v1/community/messages/users/${recipientId}`, formData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
      withCredentials: true,
    });
    
    return response.data.data;
  } catch (error) {
    logger.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get message history with a user
 * @param userId ID of the user to get conversation with
 * @param page Optional page number for pagination
 * @param perPage Optional number of messages per page
 */
export const getMessages = async (userId: string, page: number = 1, perPage: number = 20): Promise<{
  messages: Message[];
  currentPage: number;
  lastPage: number;
  total: number;
  otherUser: any;
}> => {
  try {
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      logger.log('Using mock messaging data for development');
      const mockMessages = getMockMessages(userId);
      return {
        messages: mockMessages,
        currentPage: 1,
        lastPage: 1,
        total: mockMessages.length,
        otherUser: getMockShop(userId)
      };
    }
    
    // In production, use the API
    const authToken = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/community/messages/users/${userId}`, {
      params: { page, per_page: perPage },
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
      withCredentials: true,
    });
    
    const { messages, other_user } = response.data.data;
    
    return {
      messages: messages.data,
      currentPage: messages.current_page,
      lastPage: messages.last_page,
      total: messages.total,
      otherUser: other_user
    };
  } catch (error) {
    logger.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Fetch aggregate community stats for a seller/shop.
 *
 * Endpoint: GET /api/v1/community/sellers/{shopId}/stats (public)
 * Returns avg_rating, completed_jobs, total_proposals, response_rate,
 * member_since in snake_case exactly matching SellerCommunityStats.
 */
export const getSellerStats = async (shopId: string): Promise<SellerCommunityStats> => {
  return axiosInstance.get<{ success: boolean; data: SellerCommunityStats }>(
    `/community/sellers/${shopId}/stats`
  )
    .then(response => response.data.data)
    .catch(error => {
      logger.error(`Error fetching seller stats for shop ${shopId}:`, error);
      throw error;
    });
};

/**
 * Upload an image for community content
 * NOTE: The backend does not currently have a dedicated /community/upload endpoint.
 * Images are typically uploaded as part of post/response creation via multipart form data.
 * This function will fail with a 404 until a backend endpoint is created.
 */
export const uploadCommunityImage = async (imageFile: File): Promise<{ path: string; url: string }> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await axiosInstance.post('/community/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    logger.error('Error uploading community image:', error);
    throw error;
  }
};
