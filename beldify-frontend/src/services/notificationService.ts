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

const getAuthHeaders = (): Record<string, string> => {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!authToken) {
      logger.warn('notificationService: no auth token for getNotifications');
      return { data: [], current_page: 1, last_page: 1, total: 0, per_page: 15 };
    }

    const response = await axios.get(NOTIFICATIONS_BASE, {
      params: { page },
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    // Normalize the backend shape into a flat PaginatedNotifications. The live
    // endpoint (API\Mobile\NotificationController@index) returns:
    //   { success, data: { notifications: [...], pagination: { current_page, last_page, per_page, total } } }
    // Older/other shapes also seen: a flat Laravel paginator ({ data: [...], current_page, ... })
    // or a bare array. A blind cast let the object envelope through as `data`,
    // so consumers doing notifications.slice()/items.filter() crashed the whole
    // app. Always return `data` as a real array.
    const raw: any = response.data;
    const env: any = raw?.data ?? raw; // unwrap the { success, data } envelope
    const list: Notification[] = Array.isArray(env?.notifications)
      ? env.notifications // live mobile shape: data.notifications
      : Array.isArray(env?.data)
      ? env.data // flat paginator nested under data
      : Array.isArray(env)
      ? env // envelope's data IS the array
      : Array.isArray(raw)
      ? raw // bare array response
      : [];
    const pag: any = env?.pagination ?? env ?? {};

    return {
      data: list,
      current_page: pag.current_page ?? 1,
      last_page: pag.last_page ?? 1,
      total: pag.total ?? list.length,
      per_page: pag.per_page ?? 15,
    };
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
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!authToken) {
      logger.warn('notificationService: no auth token for getUnreadCount');
      return { unread_count: 0 };
    }

    const response = await axios.get(`${NOTIFICATIONS_BASE}/unread-count`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    // The endpoint nests the count under a { success, data } envelope
    // ({ data: { unread_count } }); tolerate a flat shape too.
    const raw: any = response.data;
    const count = raw?.data?.unread_count ?? raw?.unread_count ?? 0;
    return { unread_count: count };
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
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
