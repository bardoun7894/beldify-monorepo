import type { BadgeProps } from '@/components/ui/badge';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

/**
 * Single source of truth for payout-request status → Atlas Badge variant.
 *
 * `approved` maps to the indigo `info` variant (NOT off-palette blue) so payout
 * badges stay on the Atlas palette. `paid` is the terminal success state.
 */
export const PAYOUT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warn',
  approved: 'info',
  rejected: 'error',
  paid: 'success',
};

export const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  paid: 'paid',
};

export function payoutStatusVariant(status: string): BadgeVariant {
  return PAYOUT_STATUS_VARIANT[status] ?? 'neutral';
}
