import axios from 'axios';
import logger from '@/utils/consoleLogger';
import { API_BASE_URL } from '@/config/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationData {
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: string;
  notifiable_type?: string;
  notifiable_id?: number;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

// ── Auth helpers (mirrors messagingService.ts exactly) ────────────────────────

const getCsrfToken = (): string | null => {
  if (typeof document !== 'undefined') {
    const csrfCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='));
    return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null;
  }
  return null;
};

// Safari ITP / private mode can throw SecurityError on any localStorage access;
// every token read must be try/catch-guarded or notification polling breaks.
const safeGetStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
};

const getAuthHeaders = (): Record<string, string> => {
  let token = safeGetStoredToken();

  if (!token && typeof document !== 'undefined') {
    const authCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='));
    token = authCookie ? decodeURIComponent(authCookie.split('=')[1]) : null;
  }

  const csrfToken = getCsrfToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
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

const NOTIFICATIONS_BASE = `${API_BASE_URL}/api/v1/notifications`;

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * Fetch paginated notification list for the authenticated user.
 */
export const getNotifications = async (page: number = 1): Promise<PaginatedNotifications> => {
  try {
    const authToken = safeGetStoredToken();
    if (!authToken) {
      logger.warn('notificationService: no auth token for getNotifications');
      return { data: [], current_page: 1, last_page: 1, total: 0, per_page: 15 };
    }

    const response = await axios.get(NOTIFICATIONS_BASE, {
      params: { page },
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    return response.data as PaginatedNotifications;
  } catch (error) {
    logger.error('notificationService: getNotifications error:', error);
    return { data: [], current_page: 1, last_page: 1, total: 0, per_page: 15 };
  }
};

/**
 * Get the number of unread notifications.
 * Returns { unread_count } matching the backend contract.
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    const authToken = safeGetStoredToken();
    if (!authToken) {
      logger.warn('notificationService: no auth token for getUnreadCount');
      return { unread_count: 0 };
    }

    const response = await axios.get(`${NOTIFICATIONS_BASE}/unread-count`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    return response.data as UnreadCountResponse;
  } catch (error) {
    logger.error('notificationService: getUnreadCount error:', error);
    return { unread_count: 0 };
  }
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (id: string): Promise<void> => {
  try {
    const authToken = safeGetStoredToken();
    if (!authToken) {
      logger.warn('notificationService: no auth token for markAsRead');
      return;
    }

    await axios.post(
      `${NOTIFICATIONS_BASE}/mark-read/${id}`,
      {},
      { headers: getAuthHeaders(), withCredentials: true }
    );
  } catch (error) {
    logger.error('notificationService: markAsRead error:', error);
  }
};

/**
 * Mark all notifications as read.
 */
export const markAllAsRead = async (): Promise<void> => {
  try {
    const authToken = safeGetStoredToken();
    if (!authToken) {
      logger.warn('notificationService: no auth token for markAllAsRead');
      return;
    }

    await axios.post(
      `${NOTIFICATIONS_BASE}/mark-all-read`,
      {},
      { headers: getAuthHeaders(), withCredentials: true }
    );
  } catch (error) {
    logger.error('notificationService: markAllAsRead error:', error);
  }
};

/**
 * Delete a single notification.
 */
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const authToken = safeGetStoredToken();
    if (!authToken) {
      logger.warn('notificationService: no auth token for deleteNotification');
      return;
    }

    await axios.delete(`${NOTIFICATIONS_BASE}/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
  } catch (error) {
    logger.error('notificationService: deleteNotification error:', error);
  }
};
