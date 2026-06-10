import axios from 'axios';
import { Message, Shop } from '@/types/community';
import logger from '@/utils/consoleLogger';
import { API_BASE_URL } from '@/config/constants';

// Helper function to get CSRF token
const getCsrfToken = (): string | null => {
  if (typeof document !== 'undefined') {
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='));
    return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null;
  }
  return null;
};

// Helper function to get authentication headers
const getAuthHeaders = () => {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token && typeof document !== 'undefined') {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    token = authCookie ? decodeURIComponent(authCookie.split('=')[1]) : null;
  }

  const csrfToken = getCsrfToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  return headers;
};

// Messaging endpoint prefixes — single domain, no fallback
const MESSAGING_ENDPOINTS = {
  buyer: `${API_BASE_URL}/api/v1/buyer/messages`,
  frontend: `${API_BASE_URL}/api/v1/frontend/messages`,
  community: `${API_BASE_URL}/api/v1/community/messages`,
};

/**
 * Get all conversations for the logged-in buyer
 * @returns Array of conversations with the most recent message from each
 */
export const getRecentMessages = async (): Promise<Message[]> => {
  try {
    const authToken = localStorage.getItem('token');

    if (!authToken) {
      logger.warn('No authentication token found');
      return [];
    }

    const response = await axios.get(`${MESSAGING_ENDPOINTS.frontend}/conversations`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    const data = response.data;

    return data.conversations || [];
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    return [];
  }
};

/**
 * Get message history with a shop
 * @param shopId ID of the shop to get conversation with
 * @param page Optional page number for pagination
 * @param perPage Optional number of messages per page
 * @param postId Optional post ID to filter messages by
 */
export const getConversation = async (
  userId: string,  // Changed from shopId to userId
  page: number = 1,
  perPage: number = 20,
  postId?: string
): Promise<{
  messages: Message[];
  currentPage: number;
  lastPage: number;
  total: number;
  otherUser: any;
}> => {
  try {
    const authToken = localStorage.getItem('token');

    if (!authToken) {
      throw new Error('Authentication required to view conversations');
    }

    const params: Record<string, any> = {
      page,
      per_page: perPage,
      ...(postId && { post_id: postId })
    };

    if (process.env.NODE_ENV === 'development') {
      logger.log(`Fetching conversation with user ${userId}`);
    }

    const response = await axios.get(`${MESSAGING_ENDPOINTS.frontend}/conversations/${userId}`, {
      params,
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    const data = response.data;

    return {
      messages: data.messages || [],
      currentPage: data.pagination?.current_page || 1,
      lastPage: data.pagination?.last_page || 1,
      total: data.pagination?.total || 0,
      otherUser: data.otherUser || data.user || {}
    };
  } catch (error) {
    logger.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Send a message to a shop
 * @param shopId ID of the shop
 * @param content Message content
 * @param postId Optional post ID if the message is related to a post
 * @param attachments Optional file attachments
 */
export const sendMessage = async (
  recipientId: string,  // Changed from shopId to recipientId
  content: string,
  postId?: string,
  attachments: File[] = []
): Promise<Message> => {
  try {
    if (process.env.NODE_ENV === 'development') {
      logger.log(`Sending message to user ${recipientId}`);
    }
    
    // Get token from localStorage and auth_token cookie as fallback
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // If no token in localStorage, try to get from cookies
    if (!token && typeof document !== 'undefined') {
      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='));
      token = authCookie ? decodeURIComponent(authCookie.split('=')[1]) : null;
    }
    
    if (!token) {
      logger.error('No authentication token found:', {
        hasLocalStorage: !!localStorage.getItem('token'),
        hasCookie: typeof document !== 'undefined' && document.cookie.includes('auth_token='),
      });
      throw new Error('Authentication required to send messages');
    }

    if (process.env.NODE_ENV === 'development') {
      logger.log('Sending message:', {
        hasToken: !!token,
        recipientId,
        contentLength: content.length
      });
    }
    
    const formData = new FormData();
    formData.append('recipient_id', recipientId);  // Using recipient_id as per backend docs

    // Ensure proper UTF-8 encoding for Arabic content
    // Use base64 encoding to preserve UTF-8 characters properly
    const utf8Bytes = new TextEncoder().encode(content);
    const base64Content = btoa(String.fromCharCode(...utf8Bytes));
    formData.append('content', base64Content);
    formData.append('content_encoding', 'base64');
    
    if (postId) {
      formData.append('post_id', postId);
    }
    
    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
    }
    
    // Use the new frontend API route
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch(`${baseUrl}/api/messages/send`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type for FormData - browser will set it with boundary
      },
      credentials: 'include' // Still include for any other cookies
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      logger.error('Message sending failed:', { status: response.status, error: errorMessage });
      throw new Error(`Failed to send message: ${errorMessage}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && data.message) {
      return data.message;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    logger.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get unread message count for the seller (seller-scoped endpoint).
 * Hits /api/v1/backend/messages/unread-count (Sanctum auth required).
 * Returns a plain number; returns 0 and does NOT throw on any failure
 * so callers can use it safely in polling hooks.
 */
export const getSellerUnreadCount = async (): Promise<number> => {
  try {
    const authToken = localStorage.getItem('token');

    if (!authToken) {
      logger.warn('No authentication token found for seller unread count');
      return 0;
    }

    const response = await axios.get(`${API_BASE_URL}/api/v1/backend/messages/unread-count`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    return response.data?.unread_count ?? 0;
  } catch (error) {
    logger.error('Error fetching seller unread message count:', error);
    return 0;
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (lastCheckedTimestamp?: number): Promise<{
  count: number;
  hasNew: boolean;
  newMessages?: any[];
  currentTimestamp?: number;
}> => {
  try {
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      logger.warn('No authentication token found for unread count');
      return {
        count: 0,
        hasNew: false,
        currentTimestamp: Date.now()
      };
    }

    const params: Record<string, any> = {};
    if (lastCheckedTimestamp) {
      params.last_checked = lastCheckedTimestamp;
    }

    const response = await axios.get(`${MESSAGING_ENDPOINTS.buyer}/unread-count`, {
      params,
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    if (response.data) {
      return {
        count: response.data.unread_count || 0,
        hasNew: response.data.has_new || false,
        newMessages: response.data.new_messages || [],
        currentTimestamp: response.data.current_timestamp || Date.now()
      };
    }

    return {
      count: 0,
      hasNew: false,
      currentTimestamp: Date.now()
    };
  } catch (error) {
    logger.error('Error fetching unread message count:', error);
    return {
      count: 0,
      hasNew: false,
      currentTimestamp: Date.now()
    };
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (shopId?: string, messageId?: string): Promise<{ count: number }> => {
  try {
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      logger.warn('No authentication token found for marking messages as read');
      return { count: 0 };
    }

    // The backend automatically marks messages as read when fetching conversation messages
    // So we don't need to make a separate API call here
    // The getConversationMessages endpoint in the backend already handles this:
    // Message::where('sender_id', $seller->id)->where('recipient_id', $buyer->id)->where('is_read', false)->update(['is_read' => true]);
    
    if (messageId) {
      logger.log('Message will be marked as read automatically when conversation is viewed');
      return { count: 1 };
    }
    
    if (shopId) {
      logger.log('Messages will be marked as read automatically when conversation is viewed');
      return { count: 1 };
    }
    
    return { count: 0 };
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    return { count: 0 };
  }
};

/**
 * Check for new messages from a specific shop
 * @param shopId ID of the shop to check for new messages
 * @param lastMessageId Optional ID of the last message the user has seen
 */
export const checkNewMessages = async (shopId: string, lastMessageId?: string): Promise<{
  hasNewMessages: boolean;
  count: number;
  lastMessageId: string;
  messages?: any[];
}> => {
  try {
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      logger.warn('No authentication token found for checking new messages');
      return {
        hasNewMessages: false,
        count: 0,
        lastMessageId: lastMessageId || '0'
      };
    }

    // This endpoint doesn't exist in the backend yet, so we'll use the conversation endpoint
    // to check for new messages by comparing the latest message ID
    const params: Record<string, any> = {
      page: 1,
      per_page: 1 // Only get the latest message
    };
    
    const response = await axios.get(`${MESSAGING_ENDPOINTS.buyer}/shops/${shopId}`, {
      params,
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    
    if (response.data && response.data.status === 'success' && response.data.messages) {
      const messages = response.data.messages;
      if (messages.length > 0) {
        const latestMessage = messages[0];
        const latestMessageId = latestMessage.id.toString();
        
        // Check if we have a new message
        const hasNewMessages = lastMessageId ? latestMessageId !== lastMessageId : false;
        
        return {
          hasNewMessages,
          count: hasNewMessages ? 1 : 0,
          lastMessageId: latestMessageId,
          messages: hasNewMessages ? [latestMessage] : []
        };
      }
    }
    
    return {
      hasNewMessages: false,
      count: 0,
      lastMessageId: lastMessageId || '0'
    };
  } catch (error) {
    logger.error('Error checking for new messages:', error);
    return {
      hasNewMessages: false,
      count: 0,
      lastMessageId: lastMessageId || '0'
    };
  }
};
