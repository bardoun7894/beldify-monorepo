/**
 * shippingService — shipping method fetcher with hardcoded fallback.
 *
 * Contract: GET /api/shipping-methods?subtotal=NN
 * Response:  { success: true, data: { methods: ShippingMethod[] } }
 *
 * On ANY failure (network, !success, empty list) we return the hardcoded
 * fallback so checkout is NEVER broken even when the endpoint 404s.
 *
 * Field-mapping note: ALL field names from the backend live here.
 * If BE-3 ships different names, update only this file.
 */

import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

export interface ShippingMethod {
  /** Unique key used as shipping_method_id in the order payload */
  id: string;
  /** Localised display name (backend-supplied) */
  name: string;
  /** Cost in MAD — 0 when is_free=true */
  cost: number;
  /** Subtotal above which this method becomes free (null = never free) */
  free_shipping_threshold: number | null;
  /** Human-readable ETA string, e.g. "3–5 business days" */
  delivery_time: string;
  /** Whether the method is free for the given subtotal */
  is_free: boolean;
}

// ── Hardcoded fallback — mirrors the OLD constants exactly ────────────────────
// FREE_SHIPPING_THRESHOLD = 500, STANDARD = 30, EXPRESS = 70 (pickup = free)
function buildFallback(subtotal: number): ShippingMethod[] {
  const FREE_THRESHOLD = 500;
  const STANDARD_COST = 30;
  const EXPRESS_COST = 70;

  return [
    {
      id: 'standard',
      name: 'Standard Delivery',
      cost: subtotal >= FREE_THRESHOLD ? 0 : STANDARD_COST,
      free_shipping_threshold: FREE_THRESHOLD,
      delivery_time: '3–5 business days',
      is_free: subtotal >= FREE_THRESHOLD,
    },
    {
      id: 'express',
      name: 'Express Delivery',
      cost: EXPRESS_COST,
      free_shipping_threshold: null,
      delivery_time: '1–2 business days',
      is_free: false,
    },
    {
      id: 'pickup',
      name: 'Pickup — Tetouan',
      cost: 0,
      free_shipping_threshold: null,
      delivery_time: 'Ready next business day',
      is_free: true,
    },
  ];
}

function normaliseMethod(raw: any): ShippingMethod {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    cost: Number(raw.cost ?? 0),
    free_shipping_threshold:
      raw.free_shipping_threshold != null ? Number(raw.free_shipping_threshold) : null,
    delivery_time: String(raw.delivery_time ?? ''),
    is_free: Boolean(raw.is_free),
  };
}

export const shippingService = {
  /**
   * Fetch shipping methods from the backend for the given subtotal.
   * Falls back to hardcoded constants on any failure (404, network, etc.).
   */
  async getMethods(subtotal: number): Promise<ShippingMethod[]> {
    try {
      const response = await api.get('/api/shipping-methods', {
        params: { subtotal },
      });

      const payload = response?.data;
      if (!payload?.success) {
        logger.warn('shippingService: API returned success=false, using fallback');
        return buildFallback(subtotal);
      }

      const methods: any[] = payload?.data?.methods ?? [];
      if (!Array.isArray(methods) || methods.length === 0) {
        logger.warn('shippingService: empty methods list, using fallback');
        return buildFallback(subtotal);
      }

      return methods.map(normaliseMethod);
    } catch (error) {
      logger.error('shippingService: fetch failed, using hardcoded fallback:', error);
      return buildFallback(subtotal);
    }
  },

  /** The hardcoded fallback, exported so checkout can diff changes. */
  getFallback: buildFallback,
};
