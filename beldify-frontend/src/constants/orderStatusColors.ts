import type { BadgeProps } from '@/components/ui/badge';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

/**
 * Single source of truth for seller order-status → Atlas Badge variant.
 *
 * `shipped` maps to the indigo `info` variant (NOT off-palette blue) so order
 * badges stay inside the Atlas palette across the dashboard, orders list, and
 * order-detail pages. Add new statuses here only.
 */
export const ORDER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warn',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'neutral',
};

/** English fallback labels (i18n keys live on the pages via seller.orders.status_*). */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function orderStatusVariant(status: string): BadgeVariant {
  return ORDER_STATUS_VARIANT[status] ?? 'neutral';
}
