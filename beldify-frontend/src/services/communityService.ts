import axios from 'axios';
import { CommunityPost, CommunityResponse, CommunityPostFormData, CommunityResponseFormData, Shop, Message, SellerCommunityStats, JobFilters, JobSort } from '@/types/community';
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

// Function to get CSRF token — uses same-origin Next.js route to avoid CORS
const getCsrfToken = async () => {
  try {
    // Use the same-origin Next.js proxy route; never call pro.beldify.com directly
    // from the browser (cross-origin CORS block).
    const response = await axios.get('/api/csrf-token', { withCredentials: true });
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
  baseURL: LOCAL_API_BASE, // Route through Next.js same-origin proxy at /api
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
        // Only redirect an expired auth session — guests browsing community
        // content legitimately get 401 from auth-only endpoints; don't bounce them.
        const hadToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
        if (hadToken && typeof window !== 'undefined') {
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
  // Use PUT directly — the Next.js route handler at /api/community/posts/[id]
  // exports a PUT handler. The _method spoofing trick is only needed for
  // Laravel when called directly; the Next proxy dispatches on real HTTP verbs.
  return axiosInstance.put<PostCreationResponse>(`/community/posts/${id}`, formData, {
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
 * Buyer submits (or updates) a review of the seller after the deal is delivered.
 * POST /community/posts/{postId}/responses/{responseId}/review — one review per
 * accepted proposal; re-submitting overwrites. Feeds the seller's avgRating.
 */
export const submitSellerReview = async (
  postId: string,
  responseId: string,
  rating: number,
  comment?: string
): Promise<{ id: string | number; rating: number; comment?: string | null }> => {
  try {
    const response = await axiosInstance.post(
      `/community/posts/${postId}/responses/${responseId}/review`,
      { rating, comment: comment ?? null }
    );
    return response.data.data;
  } catch (error) {
    logger.error(`Error submitting review for response ${responseId}:`, error);
    throw error;
  }
};

/** Payload accepted by the seller proposal-update endpoint. */
export interface UpdateResponsePayload {
  description: string;
  price?: number | null;
  delivery_days?: number | null;
  seller_skills?: string[] | null;
}

/**
 * Seller updates their own PENDING proposal (edit-cap enforced server-side).
 *
 * Endpoint: PATCH /api/v1/seller/community/responses/{response}
 * Auth: sanctum + role:store_owner, must own the response.
 * Errors: 403 (not owner), 422 (not pending / edit-cap reached).
 */
export const updateResponse = async (
  responseId: string,
  payload: UpdateResponsePayload
): Promise<CommunityResponse> => {
  try {
    const response = await axiosInstance.patch<{ success: boolean; data: CommunityResponse }>(
      `/community/responses/${responseId}`,
      payload
    );
    return response.data.data;
  } catch (error) {
    logger.error(`Error updating response ${responseId}:`, error);
    throw error;
  }
};

/**
 * @deprecated Use {@link updateResponse} instead — the backend now exposes a
 * real PATCH endpoint for editing a seller's own pending proposal.
 */
export const updateCommunityResponse = async (
  _postId: string,
  responseId: string,
  formData: FormData
): Promise<CommunityResponse> => {
  const payload: UpdateResponsePayload = {
    description: String(formData.get('description') || ''),
  };
  const price = formData.get('price');
  if (price != null) payload.price = Number(price);
  const deliveryDays = formData.get('delivery_days');
  if (deliveryDays != null) payload.delivery_days = Number(deliveryDays);
  const skills = formData.getAll('seller_skills[]').map(String);
  if (skills.length > 0) payload.seller_skills = skills;
  return updateResponse(responseId, payload);
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
 * Fetch the authenticated buyer's own community posts.
 *
 * Endpoint: GET /api/v1/community/posts?user_id={userId}&page={page}&per_page={per_page}
 * The backend GET /api/v1/community/posts supports ?user_id= for server-side filtering.
 * Returns PaginatedPosts shaped the same way as fetchCommunityPosts.
 */
export const fetchMyPosts = async (
  params: { page?: number; per_page?: number } = {}
): Promise<PaginatedPosts> => {
  const { page = 1, per_page = 20 } = params;
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(per_page),
    mine: '1',            // hint for backends that support it
  });

  return axiosInstance.get<PaginatedPosts>(`/community/posts?${query.toString()}`)
    .then(response => response.data)
    .catch(error => {
      logger.error('Error fetching my community posts:', error);
      throw error;
    });
};

/**
 * Close (soft-delete / status transition) a community post owned by the
 * authenticated user.
 *
 * The backend DELETE /api/v1/community/posts/{post} is re-used here —
 * it marks the post as deleted / closed server-side. A dedicated PATCH
 * endpoint is not available on the current backend.
 *
 * Endpoint: DELETE /api/v1/community/posts/{id}
 */
export const closePost = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/community/posts/${id}`);
  } catch (error) {
    logger.error(`Error closing community post ${id}:`, error);
    throw error;
  }
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
