import { useEffect, useState, useCallback } from 'react';
import { messaging, messagingDisabledReason } from '../lib/firebase';

interface FCMNotification {
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

interface FCMState {
  token: string;
  notification: FCMNotification | null;
  error: string | null;
  isSupported: boolean;
}

/**
 * Hook for Firebase Cloud Messaging.
 *
 * Returns a disabled-but-safe state when Firebase Messaging is unavailable
 * (insecure context, missing config, unsupported browser) so that consuming
 * components never crash.
 */
const useFCM = () => {
  const [state, setState] = useState<FCMState>({
    token: '',
    notification: null,
    error: messagingDisabledReason,
    isSupported: false,
  });

  const setNotification = useCallback((n: FCMNotification | null) => {
    setState((prev) => ({ ...prev, notification: n }));
  }, []);

  // ── Token retrieval ──────────────────────────────────────────────────
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    // If messaging was disabled at init time, nothing to do
    if (!messaging) {
      // Intentionally silent when messaging was disabled at init — reason is exposed
      // via `messagingDisabledReason` for any code that needs to surface it.
      return;
    }

    // Runtime capability checks (belt-and-suspenders alongside firebase.ts)
    if (!('serviceWorker' in navigator)) {
      console.warn('FCM: Service Worker not supported in this browser');
      setState((prev) => ({ ...prev, error: 'Service Worker not supported' }));
      return;
    }
    if (!('PushManager' in window)) {
      console.warn('FCM: Push API not supported in this browser');
      setState((prev) => ({ ...prev, error: 'Push API not supported' }));
      return;
    }
    if (!('Notification' in window)) {
      console.warn('FCM: Notification API not available');
      setState((prev) => ({ ...prev, error: 'Notification API not available' }));
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    const retrieveToken = async () => {
      try {
        // Check VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
        const isPlaceholder = typeof vapidKey === 'string' && (
          vapidKey.startsWith('REPLACE_') ||
          vapidKey === 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        );
        if (!vapidKey || isPlaceholder) {
          console.warn('FCM: VAPID key not configured – FCM features disabled');
          setState((prev) => ({ ...prev, error: 'FCM not configured' }));
          return;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('FCM: Notification permission denied');
          setState((prev) => ({ ...prev, error: 'Notification permission denied' }));
          return;
        }

        // Dynamic import so getToken is only loaded when actually needed
        const { getToken } = await import('firebase/messaging');

        console.log('FCM: Registering service worker...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
        console.log('FCM: Service worker registered');

        const currentToken = await getToken(messaging!, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log('FCM: Token obtained');
          setState((prev) => ({ ...prev, token: currentToken, error: null }));

          // Send token to backend (non-blocking)
          try {
            const authToken =
              localStorage.getItem('token') ||
              localStorage.getItem('authToken') ||
              localStorage.getItem('auth_token');

            if (authToken) {
              await fetch('/api/fcm/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ fcm_token: currentToken }),
              });
              console.log('FCM: Token sent to backend');
            }
          } catch (backendError) {
            console.warn('FCM: Failed to send token to backend:', backendError);
          }
        } else {
          console.warn('FCM: No registration token available');
          setState((prev) => ({
            ...prev,
            error: 'No FCM registration token available.',
          }));
        }
      } catch (error: any) {
        console.warn('FCM: Error retrieving token:', error);

        let message = 'Unknown FCM error';
        if (error.code === 'messaging/failed-service-worker-registration') {
          message = 'Service Worker registration failed.';
        } else if (error.code === 'messaging/permission-blocked') {
          message = 'Notification permission blocked.';
        } else if (error.code === 'installations/request-failed') {
          message = 'Firebase installation request failed.';
        } else if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
          message = 'Firebase permission denied.';
        } else if (error.message) {
          message = error.message;
        }

        setState((prev) => ({ ...prev, error: `FCM Error: ${message}` }));
      }
    };

    retrieveToken();
  }, []);

  // ── Foreground message listener ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !messaging) return;

    let unsubscribe: (() => void) | undefined;

    import('firebase/messaging')
      .then(({ onMessage }) => {
        unsubscribe = onMessage(messaging!, (payload) => {
          console.log('FCM: Foreground message received:', payload);
          setState((prev) => ({
            ...prev,
            notification: {
              title: payload.notification?.title,
              body: payload.notification?.body,
              data: payload.data,
            },
          }));
        });
      })
      .catch((err) => {
        console.warn('FCM: Failed to set up message listener:', err);
      });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return {
    token: state.token,
    notification: state.notification,
    setNotification,
    error: state.error,
    isSupported: state.isSupported,
  };
};

export default useFCM;