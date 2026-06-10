'use client';

/**
 * OfferCountdownChip — live countdown chip for product offer expiry.
 *
 * Usage:
 *   <OfferCountdownChip endsAt={product.ends_at} />
 *
 * Render-gated on `isOfferActive(endsAt)`:
 * - Renders nothing when endsAt is null/undefined/past.
 * - Renders amber countdown when endsAt is a future ISO timestamp.
 *
 * NOTE: The `ends_at` field does NOT currently exist in backend API responses
 * for product cards (Product type in src/lib/types.ts has no ends_at).
 * This component is implemented and tested now; it will render once the
 * backend MegaOffer / ProductOffer endpoint exposes `ends_at` on products.
 * Backend task: expose `ends_at` (ISO timestamp) on Product and/or
 * MegaOfferCollection.featured_products responses.
 */

import { useState, useEffect, useCallback } from 'react';
import { Flame } from 'lucide-react';

// ── Pure helpers — exported for unit testing ──────────────────────────────────

/**
 * Returns true when `endsAt` is a valid future ISO timestamp.
 * Safe against null / undefined / already-passed dates.
 */
export function isOfferActive(endsAt: string | null | undefined): boolean {
  if (!endsAt) return false;
  try {
    const end = new Date(endsAt).getTime();
    if (isNaN(end)) return false;
    return end > Date.now();
  } catch {
    return false;
  }
}

/**
 * Formats the remaining time until `endsAt` as a human-readable string.
 * - >= 1 hour: "Ends in Xh Ym"
 * - < 1 hour:  "Ends in Xm"
 * - <= 0:      "Offer ended"
 */
export function formatCountdown(endsAt: string | null | undefined): string {
  if (!endsAt) return '';
  try {
    const msLeft = new Date(endsAt).getTime() - Date.now();
    if (msLeft <= 0) return 'Offer ended';
    const totalSeconds = Math.floor(msLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours >= 1) {
      return `Ends in ${hours}h ${minutes}m`;
    }
    return `Ends in ${minutes}m`;
  } catch {
    return '';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface OfferCountdownChipProps {
  /** ISO 8601 timestamp when the offer expires. Null/undefined → chip hidden. */
  endsAt: string | null | undefined;
  /** Override label prefix (default "Ends in"). Useful for i18n. */
  labelOverride?: string;
  className?: string;
}

export default function OfferCountdownChip({
  endsAt,
  labelOverride,
  className = '',
}: OfferCountdownChipProps) {
  const [label, setLabel] = useState<string>('');

  const tick = useCallback(() => {
    if (!isOfferActive(endsAt)) {
      setLabel('');
      return;
    }
    if (!endsAt) return;
    const raw = formatCountdown(endsAt);
    // Apply label override prefix if provided
    if (labelOverride && raw.startsWith('Ends in ')) {
      setLabel(raw.replace('Ends in ', `${labelOverride} `));
    } else {
      setLabel(raw);
    }
  }, [endsAt, labelOverride]);

  useEffect(() => {
    // Initial render
    tick();
    // Tick every 30 seconds (sufficient resolution for hours/minutes display)
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [tick]);

  // Render nothing when offer is not active
  if (!isOfferActive(endsAt) || !label) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 bg-amber-500 text-amber-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm select-none ${className}`}
      aria-live="off"
      aria-label={label}
    >
      <Flame
        className="h-2.5 w-2.5 flex-shrink-0"
        aria-hidden="true"
        strokeWidth={2}
      />
      {label}
    </span>
  );
}
