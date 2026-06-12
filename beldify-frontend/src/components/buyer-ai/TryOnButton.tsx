'use client';

/**
 * TryOnButton — PDP "Try it on" entry chip
 *
 * Shown ONLY when:
 *   (a) product vertical is apparel (isJewelry === false)
 *   (b) GET /api/tryon/config returns { enabled: true }
 *
 * ANY error from the config fetch → hidden (never break the PDP).
 * Atlas styling: indigo secondary with sparkle/wand icon.
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2 } from 'lucide-react';
import { fetchTryonConfig } from '@/services/tryonService';
import { cn } from '@/lib/utils';

interface TryOnButtonProps {
  /** True when the product is a jewelry vertical — hides the button */
  isJewelry: boolean;
  productId: string | number;
  onOpen: () => void;
  className?: string;
}

export function TryOnButton({
  isJewelry,
  productId: _productId,
  onOpen,
  className,
}: TryOnButtonProps) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (isJewelry) {
      setEnabled(false);
      return;
    }
    let cancelled = false;
    fetchTryonConfig()
      .then((cfg) => {
        if (!cancelled) setEnabled(cfg.enabled);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isJewelry]);

  // Not yet resolved or disabled
  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'bg-indigo-50 ring-1 ring-indigo-200 text-indigo-700',
        'px-4 py-2 text-sm font-semibold',
        'hover:bg-indigo-100 transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
        'rtl:flex-row-reverse',
        className
      )}
      aria-label={t('tryon.button_label', 'Try it on — virtual fitting')}
    >
      <Wand2 className="h-4 w-4 shrink-0" aria-hidden />
      <span>{t('tryon.button', 'Try it on')}</span>
    </button>
  );
}
