/**
 * analytics.ts — typed first-party analytics event layer
 *
 * Design goals:
 * - SSR-safe: all window access is guarded by `typeof window === 'undefined'`
 * - Vendor-agnostic: each vendor (GA4, Meta Pixel, TikTok) no-ops independently
 *   when its global (gtag / fbq / ttq) is absent or its env var is unset
 * - Zero-blocking UI: backend POST is fire-and-forget; errors are swallowed
 * - Strictly typed: GA4 ecommerce param shapes (items[], value, currency: 'MAD')
 *
 * Activation (set in .env.local):
 *   NEXT_PUBLIC_GA4_ID         — G-XXXXXXXXXX
 *   NEXT_PUBLIC_GTM_ID         — GTM-XXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID  — numeric pixel ID
 *   NEXT_PUBLIC_TIKTOK_PIXEL_ID — alphanumeric pixel ID
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** GA4 ecommerce item shape */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
  item_variant?: string;
}

/** Strongly-typed union of all supported events */
export type AnalyticsEvent =
  | {
      event: 'page_view';
      page_path: string;
      page_title?: string;
    }
  | {
      event: 'view_item';
      currency: 'MAD';
      value: number;
      items: AnalyticsItem[];
    }
  | {
      event: 'add_to_cart';
      currency: 'MAD';
      value: number;
      items: AnalyticsItem[];
    }
  | {
      event: 'begin_checkout';
      currency: 'MAD';
      value: number;
      items: AnalyticsItem[];
    }
  | {
      event: 'purchase';
      transaction_id: string;
      value: number;
      currency: 'MAD';
      items: AnalyticsItem[];
      tax?: number;
      shipping?: number;
    };

// ── Internal vendor helpers ───────────────────────────────────────────────────

type WindowWithVendors = Window & {
  dataLayer?: Record<string, unknown>[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
};

function getWindow(): WindowWithVendors | null {
  if (typeof window === 'undefined') return null;
  return window as WindowWithVendors;
}

/** Push to GTM dataLayer */
function pushDataLayer(payload: Record<string, unknown>): void {
  const win = getWindow();
  if (!win) return;
  if (!win.dataLayer) win.dataLayer = [];
  win.dataLayer.push(payload);
}

/** Forward to GA4 via gtag() */
function forwardGA4(event: AnalyticsEvent): void {
  const win = getWindow();
  if (!win || typeof win.gtag !== 'function') return;

  const { event: eventName, ...params } = event;
  win.gtag('event', eventName, params);
}

/** Forward to Meta Pixel via fbq() */
function forwardMeta(event: AnalyticsEvent): void {
  const win = getWindow();
  if (!win || typeof win.fbq !== 'function') return;

  // Map GA4 event names → Meta Pixel standard events
  const metaEventMap: Record<string, string> = {
    page_view: 'PageView',
    view_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
  };

  const metaEvent = metaEventMap[event.event];
  if (!metaEvent) return;

  if (event.event === 'page_view') {
    win.fbq('track', metaEvent);
    return;
  }

  const metaParams: Record<string, unknown> = {
    currency: 'MAD',
  };

  if ('value' in event) metaParams.value = event.value;
  if ('items' in event && event.items.length > 0) {
    metaParams.content_ids = event.items.map((i) => i.item_id);
    metaParams.contents = event.items.map((i) => ({
      id: i.item_id,
      quantity: i.quantity,
    }));
    metaParams.content_type = 'product';
    metaParams.num_items = event.items.reduce((s, i) => s + i.quantity, 0);
  }
  if (event.event === 'purchase') {
    metaParams.order_id = event.transaction_id;
  }

  win.fbq('track', metaEvent, metaParams);
}

/** Forward to TikTok Pixel via ttq.track() */
function forwardTikTok(event: AnalyticsEvent): void {
  const win = getWindow();
  if (!win || !win.ttq || typeof win.ttq.track !== 'function') return;

  // Map GA4 event names → TikTok standard events
  const ttqEventMap: Record<string, string> = {
    page_view: 'ViewContent',
    view_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'PlaceAnOrder',
  };

  const ttqEvent = ttqEventMap[event.event];
  if (!ttqEvent) return;

  const params: Record<string, unknown> = { currency: 'MAD' };
  if ('value' in event) params.value = event.value;
  if ('items' in event && event.items.length > 0) {
    params.contents = event.items.map((i) => ({
      content_id: i.item_id,
      content_name: i.item_name,
      quantity: i.quantity,
      price: i.price,
    }));
  }
  if (event.event === 'purchase') {
    params.order_id = event.transaction_id;
  }

  win.ttq.track(ttqEvent, params);
}

/** Fire-and-forget backend POST — never blocks UI, never surfaces errors */
function postToBackend(event: AnalyticsEvent): void {
  const win = getWindow();

  // Build headers — mirror the X-Guest-Token pattern from src/lib/api.ts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (win) {
    const authToken = localStorage.getItem('token');
    const guestToken = localStorage.getItem('guest_token');

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else if (guestToken) {
      headers['X-Guest-Token'] = guestToken;
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  fetch(`${apiUrl}/api/analytics/track`, {
    method: 'POST',
    headers,
    // Contract MUST match the backend AnalyticsTrackController validation:
    // `event_type` (in AnalyticsEvent::VALID_EVENT_TYPES) is required; the full
    // typed event goes in `payload`; url/referrer are accepted for attribution.
    body: JSON.stringify({
      event_type: event.event,
      payload: event,
      url: win?.location.href ?? null,
      referrer: win?.document.referrer || null,
    }),
  }).catch(() => {
    // Swallow all errors — this is non-critical telemetry
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Track an analytics event across all configured vendors.
 *
 * - SSR-safe (no-ops if called server-side)
 * - Each vendor no-ops independently when its global is absent
 * - Backend POST is fire-and-forget and never throws
 *
 * @example
 * track({ event: 'add_to_cart', currency: 'MAD', value: 299, items: [...] });
 */
export async function track(event: AnalyticsEvent): Promise<void> {
  // SSR guard — bail immediately on the server
  if (typeof window === 'undefined') return;

  // 1. GTM dataLayer (always — even if GTM isn't loaded, datalayer is always useful)
  const { event: eventName, ...params } = event;
  pushDataLayer({ event: eventName, ...params });

  // 2. GA4 via gtag
  forwardGA4(event);

  // 3. Meta Pixel via fbq
  forwardMeta(event);

  // 4. TikTok Pixel via ttq
  forwardTikTok(event);

  // 5. First-party backend (fire-and-forget)
  postToBackend(event);
}
