// defaultCache lives in @serwist/next/worker, NOT the core serwist package —
// importing it from 'serwist' resolves to undefined at runtime and the
// `...defaultCache` spread below kills SW evaluation ("not iterable").
import { defaultCache } from '@serwist/next/worker';
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';

declare const self: ServiceWorkerGlobalScope;

// IMPORTANT: serwist's runtime `runtimeCaching` requires strategy INSTANCES.
// String handler names ('CacheFirst', …) are workbox build-config syntax — they
// register fine but every matched fetch then calls .handle() on a string and
// rejects with net::ERR_FAILED, silently killing all API/image requests.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // App shell — cache first with network fallback
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && /^\/(_next\/static|icons|favicon)/.test(url.pathname),
      handler: new CacheFirst({
        cacheName: 'static-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // Images — stale-while-revalidate, only cache good responses
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new StaleWhileRevalidate({
        cacheName: 'images',
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    // GET API reads — network first so reloads always show fresh data,
    // cached copy only as offline fallback. Auth/session endpoints excluded.
    {
      matcher: ({ url, request }) =>
        request.method === 'GET' &&
        !url.pathname.startsWith('/api/auth') &&
        !url.pathname.startsWith('/api/csrf') &&
        (url.pathname.startsWith('/api/') ||
          url.hostname === 'api.beldify.com' ||
          url.hostname === 'pro.beldify.com'),
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 6,
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 10 * 60, // 10 minutes (offline fallback only)
          }),
        ],
      }),
    },
    // Google Fonts — cache first
    {
      matcher: ({ url }) => /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname),
      handler: new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          }),
        ],
      }),
    },
    // Fallback: Next.js-aware defaults for everything else
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
