'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '@/utils/consoleLogger';
import {
  subscribeToPush,
  unsubscribeFromPush,
  buildPushSubscriptionPayload,
  type PushSubscriptionPayload,
} from '@/utils/webPush';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UseWebPushResult {
  /** Current browser notification permission */
  permission: PushPermission;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Whether a subscribe/unsubscribe operation is in progress */
  isLoading: boolean;
  /** Last error message, or null */
  error: string | null;
  /** Subscribe: request permission, subscribe via pushManager, POST to backend */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe: remove pushManager subscription, DELETE from backend */
  unsubscribe: () => Promise<boolean>;
  /** Whether the browser supports push at all */
  isSupported: boolean;
}

/**
 * Check whether Web Push is supported in this browser/context.
 */
function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get the current Notification permission, or 'unsupported' if unavailable.
 */
function getCurrentPermission(): PushPermission {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission as PushPermission;
}

/**
 * POST the push subscription to the backend (Sanctum-authenticated).
 * Endpoint: POST /api/push/subscribe
 * Body: { endpoint, keys: { p256dh, auth } }
 */
async function postSubscription(
  payload: PushSubscriptionPayload,
  authToken: string
): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`[webPush] subscribe backend error ${res.status}: ${msg}`);
  }
}

/**
 * DELETE the push subscription from the backend.
 * Endpoint: DELETE /api/push/unsubscribe
 * Body: { endpoint }
 */
async function deleteSubscription(
  endpoint: string,
  authToken: string
): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/unsubscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok && res.status !== 404) {
    // 404 is acceptable — subscription may already be cleaned up server-side
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`[webPush] unsubscribe backend error ${res.status}: ${msg}`);
  }
}

/**
 * Retrieve the auth token from localStorage (mirrors the pattern useFCM used).
 */
function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('auth_token')
    );
  } catch {
    /* localStorage unavailable (Safari private mode / sandboxed iframe) */
    return null;
  }
}

/**
 * useWebPush — manages native Web Push subscription lifecycle.
 *
 * - Reads NEXT_PUBLIC_VAPID_PUBLIC_KEY (inlined at build time)
 * - Uses the active service worker registration (waits for SW ready)
 * - POSTs { endpoint, keys } to /api/push/subscribe on subscribe
 * - DELETEs { endpoint } from /api/push/unsubscribe on unsubscribe
 */
export function useWebPush(): UseWebPushResult {
  const [permission, setPermission] = useState<PushPermission>(getCurrentPermission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const isSupported = isPushSupported();

  // On mount: read existing subscription state + cache SW registration
  useEffect(() => {
    if (!isSupported) return;

    let cancelled = false;

    const init = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;
        registrationRef.current = registration;
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setIsSubscribed(!!existing);
        }
      } catch (err) {
        if (!cancelled) {
          logger.warn('[useWebPush] init error:', err);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  // Keep permission state in sync with Notification.permission
  useEffect(() => {
    if (!isSupported) return;
    setPermission(getCurrentPermission());
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Web Push is not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      let registration = registrationRef.current;
      if (!registration) {
        registration = await navigator.serviceWorker.ready;
        registrationRef.current = registration;
      }

      const subscription = await subscribeToPush(registration);
      if (!subscription) {
        setPermission(Notification.permission as PushPermission);
        setError(
          Notification.permission === 'denied'
            ? 'Notification permission denied — enable it in browser settings'
            : 'Could not subscribe to push notifications'
        );
        return false;
      }

      const payload = buildPushSubscriptionPayload(subscription);
      const authToken = getAuthToken();

      if (authToken) {
        await postSubscription(payload, authToken);
      }

      setIsSubscribed(true);
      setPermission('granted');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      logger.error('[useWebPush] subscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      let registration = registrationRef.current;
      if (!registration) {
        registration = await navigator.serviceWorker.ready;
        registrationRef.current = registration;
      }

      // Capture endpoint before unsubscribing
      const existing = await registration.pushManager.getSubscription();
      const endpoint = existing?.endpoint;

      const ok = await unsubscribeFromPush(registration);

      if (ok && endpoint) {
        const authToken = getAuthToken();
        if (authToken) {
          await deleteSubscription(endpoint, authToken).catch((err) =>
            logger.warn('[useWebPush] backend unsubscribe failed (non-fatal):', err)
          );
        }
      }

      setIsSubscribed(false);
      return ok;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      logger.error('[useWebPush] unsubscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported,
  };
}
