/**
 * Web Push utility helpers (native VAPID — no Firebase).
 *
 * urlBase64ToUint8Array  — converts a base64url-encoded VAPID public key
 *   into a Uint8Array suitable for PushManager.subscribe().
 *
 * buildPushSubscriptionPayload — extracts the subscription JSON the backend
 *   needs: { endpoint, keys: { p256dh, auth } }.
 */

/**
 * Convert a base64url string (VAPID public key format) to a Uint8Array.
 *
 * The Web Push / VAPID spec encodes the application server key as an
 * unpadded base64url string. PushManager.subscribe() expects a Uint8Array.
 *
 * @throws {Error} on empty input
 */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  if (!base64Url) {
    throw new Error('urlBase64ToUint8Array: base64Url must not be empty');
  }

  // base64url uses - and _ instead of + and /; atob needs standard base64
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding to reach a multiple of 4
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  const rawData = atob(padded);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Shape the PushSubscription into the plain JSON object the backend expects:
 *
 * {
 *   endpoint: string,            // full push service URL
 *   keys: {
 *     p256dh: string,            // base64url-encoded client public key
 *     auth:   string,            // base64url-encoded auth secret
 *   }
 * }
 *
 * @throws {Error} if subscription has no endpoint
 */
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function buildPushSubscriptionPayload(
  subscription: PushSubscription
): PushSubscriptionPayload {
  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? subscription.endpoint;

  if (!endpoint) {
    throw new Error('buildPushSubscriptionPayload: subscription has no endpoint');
  }

  return {
    endpoint,
    keys: {
      p256dh: (json.keys?.p256dh ?? '') as string,
      auth: (json.keys?.auth ?? '') as string,
    },
  };
}

/**
 * Subscribe to Web Push using the VAPID public key from the environment.
 * Returns null if the browser does not support push or permission is denied.
 *
 * @param registration - the active ServiceWorkerRegistration
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn('[webPush] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });
    return subscription;
  } catch (err) {
    console.error('[webPush] subscribe failed:', err);
    return null;
  }
}

/**
 * Unsubscribe from Web Push. Returns true if successfully unsubscribed.
 *
 * @param registration - the active ServiceWorkerRegistration
 */
export async function unsubscribeFromPush(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;
    return await subscription.unsubscribe();
  } catch (err) {
    console.error('[webPush] unsubscribe failed:', err);
    return false;
  }
}
