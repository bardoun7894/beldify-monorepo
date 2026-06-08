import type { } from '@serwist/next/worker';
import { defaultCache, Serwist } from 'serwist';

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // App shell — cache first with network fallback
    {
      matcher: /^\/(_next\/static|icons|favicon)\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Images — stale-while-revalidate
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // GET API requests — stale-while-revalidate for offline browsing
    {
      matcher: ({ url, request }) =>
        request.method === 'GET' &&
        (url.pathname.startsWith('/api/') || url.hostname === 'api.beldify.com'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        // Don't cache non-2xx responses
        plugins: [],
      },
    },
    // Google Fonts — cache first
    {
      matcher: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    // Fallback: network-first for all other requests
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ── Native Web Push handlers ──────────────────────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    icon?: string;
    url?: string;
    data?: Record<string, unknown>;
  } = {};

  try {
    payload = event.data.json();
  } catch {
    // Plain text fallback
    payload = { title: 'Beldify', body: event.data.text() };
  }

  const title = payload.title ?? 'Beldify';
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icons/manifest-icon-192.maskable.png',
    badge: '/icons/favicon-32x32.png',
    data: {
      url: payload.url ?? '/',
      ...payload.data,
    },
    dir: 'rtl', // default RTL for Arabic-first app
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url: string = (event.notification.data as { url?: string })?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus that tab and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            void (client as WindowClient).navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
